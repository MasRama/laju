"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Redis_1 = __importDefault(require("../services/Redis"));
const DB_1 = __importDefault(require("../services/DB"));
const Authenticate_1 = __importDefault(require("../services/Authenticate"));
const GoogleAuth_1 = require("../services/GoogleAuth");
const axios_1 = __importDefault(require("axios"));
const helper_1 = require("../services/helper");
const dayjs_1 = __importDefault(require("dayjs"));
const Mailer_1 = __importDefault(require("../services/Mailer"));
class AuthController {
    async registerPage(request, response) {
        if (request.cookies.auth_id) {
            return response.redirect("/home");
        }
        return response.inertia("auth/register");
    }
    async homePage(request, response) {
        const page = parseInt(request.query.page) || 1;
        const search = request.query.search || "";
        const filter = request.query.filter || "all";
        let query = DB_1.default.from("users").select("*");
        if (search) {
            query = query.where(function () {
                this.where('name', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`)
                    .orWhere('phone', 'like', `%${search}%`);
            });
        }
        if (filter === 'verified') {
            query = query.where('is_verified', true);
        }
        else if (filter === 'unverified') {
            query = query.where('is_verified', false);
        }
        const countQuery = query.clone();
        const total = await countQuery.count('* as count').first();
        const users = await query
            .orderBy('created_at', 'desc')
            .offset((page - 1) * 10)
            .limit(10);
        return response.inertia("home", {
            users,
            total: 0,
            page,
            search,
            filter
        });
    }
    async deleteUsers(request, response) {
        const { ids } = request.body;
        if (!Array.isArray(ids)) {
            return response.status(400).json({ error: 'Invalid request format' });
        }
        if (!request.user.is_admin) {
            return response.status(403).json({ error: 'Unauthorized' });
        }
        await DB_1.default.from("users")
            .whereIn('id', ids)
            .delete();
        return response.redirect("/home");
    }
    async profilePage(request, response) {
        return response.inertia("profile");
    }
    async changeProfile(request, response) {
        const data = await request.json();
        await DB_1.default.from("users").where("id", request.user.id).update({
            name: data.name,
            email: data.email.toLowerCase(),
            phone: data.phone,
        });
        return response.json({ message: "Your profile has been updated" });
    }
    async changePassword(request, response) {
        const data = await request.json();
        const user = await DB_1.default.from("users")
            .where("id", request.user.id)
            .first();
        const password_match = await Authenticate_1.default.compare(data.current_password, user.password);
        if (password_match) {
            await DB_1.default.from("users")
                .where("id", request.user.id)
                .update({
                password: await Authenticate_1.default.hash(data.new_password),
            });
        }
        else {
            return response
                .status(400)
                .json({ message: "Password lama tidak cocok" });
        }
    }
    async forgotPasswordPage(request, response) {
        return response.inertia("auth/forgot-password");
    }
    async resetPasswordPage(request, response) {
        const id = request.params.id;
        const user_id = await Redis_1.default.get("reset-password:" + id);
        if (!user_id) {
            return response.status(404).send("Link tidak valid");
        }
        return response.inertia("auth/reset-password", { id: request.params.id });
    }
    async resetPassword(request, response) {
        const { id, password } = await request.json();
        const user_id = await Redis_1.default.get("reset-password:" + id);
        if (!user_id) {
            return response.status(404).send("Link tidak valid");
        }
        await DB_1.default.from("users")
            .where("id", user_id)
            .update({ password: await Authenticate_1.default.hash(password) });
        const user = await DB_1.default.from("users").where("id", user_id).first();
        return Authenticate_1.default.process(user, request, response);
    }
    async sendResetPassword(request, response) {
        let { email, phone } = await request.json();
        let user;
        if (email && email.includes("@")) {
            user = await DB_1.default.from("users").where("email", email).first();
        }
        else if (phone) {
            user = await DB_1.default.from("users").where("phone", phone).first();
        }
        if (!user) {
            return response.status(404).send("Email tidak terdaftar");
        }
        const id = (0, helper_1.generateUUID)();
        try {
            await Mailer_1.default.sendMail({
                from: '"Dripsender Auth" <dripsender.id@gmail.com>',
                to: email,
                subject: "Reset Password",
                text: `Anda telah melakukan reset password. Jika itu benar, silakan Klik link berikut : 
      
        ${process.env.APP_URL}/reset-password/${id}
        
        Jika anda tidak merasa melakukan reset password, abaikan email ini.
              `,
            });
        }
        catch (error) { }
        try {
            if (user.phone)
                await axios_1.default.post("https://api.dripsender.id/send", {
                    api_key: "ee042c8b-f5e1-4366-abc1-ee771d209384",
                    phone: user.phone,
                    text: `Anda telah melakukan reset password. Jika itu benar, silakan Klik link berikut : 
      
${process.env.APP_URL}/reset-password/${id}
          
Jika anda tidak merasa melakukan reset password, abaikan pesan  ini.
                `,
                });
        }
        catch (error) { }
        await Redis_1.default.setEx("reset-password:" + id, 60 * 60 * 24, user.id);
        return response.send("OK");
    }
    async loginPage(request, response) {
        return response.inertia("auth/login");
    }
    async redirect(request, response) {
        const params = (0, GoogleAuth_1.redirectParamsURL)();
        const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
        return response.redirect(googleLoginUrl);
    }
    async googleCallback(request, response) {
        const { code } = request.query;
        const { data } = await (0, axios_1.default)({
            url: `https://oauth2.googleapis.com/token`,
            method: "post",
            data: {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
                code,
            },
        });
        const result = await (0, axios_1.default)({
            url: "https://www.googleapis.com/oauth2/v2/userinfo",
            method: "get",
            headers: {
                Authorization: `Bearer ${data.access_token}`,
            },
        });
        let { email, name, verified_email } = result.data;
        email = email.toLowerCase();
        const check = await DB_1.default.from("users").where("email", email).first();
        if (check) {
            return Authenticate_1.default.process(check, request, response);
        }
        else {
            const user = {
                id: (0, helper_1.generateUUID)(),
                email: email,
                password: await Authenticate_1.default.hash(email),
                name: name,
                is_verified: verified_email,
                created_at: (0, dayjs_1.default)().valueOf(),
                updated_at: (0, dayjs_1.default)().valueOf(),
            };
            await DB_1.default.table("users").insert(user);
            return Authenticate_1.default.process(user, request, response);
        }
    }
    async processLogin(request, response) {
        let body = await request.json();
        let { email, password, phone } = body;
        let user;
        if (email && email.includes("@")) {
            user = await DB_1.default.from("users").where("email", email).first();
        }
        else if (phone) {
            user = await DB_1.default.from("users").where("phone", phone).first();
        }
        if (user) {
            const password_match = await Authenticate_1.default.compare(password, user.password);
            if (password_match) {
                return Authenticate_1.default.process(user, request, response);
            }
            else {
                return response
                    .flash("error", "Maaf, Password salah")
                    .redirect("/login");
            }
        }
        else {
            return response
                .flash("error", "Email/No.HP tidak terdaftar")
                .redirect("/login");
        }
    }
    async processRegister(request, response) {
        let { email, password, name } = await request.json();
        email = email.toLowerCase();
        try {
            const user = {
                email: email,
                id: (0, helper_1.generateUUID)(),
                name,
                password: await Authenticate_1.default.hash(password),
            };
            const id = await DB_1.default.table("users").insert(user);
            return Authenticate_1.default.process(user, request, response);
        }
        catch (error) {
            console.log(error);
            return response
                .cookie("error", "Maaf, Email sudah terdaftar")
                .redirect("/register");
        }
    }
    async verify(request, response) {
        const id = (0, helper_1.generateUUID)();
        try {
            await Mailer_1.default.sendMail({
                from: '"Dripsender Auth" <dripsender.id@gmail.com>',
                to: request.user.email,
                subject: "Verifikasi Akun",
                text: "Klik link berikut untuk verifikasi email anda : " +
                    process.env.APP_URL +
                    "/verify/" +
                    id,
            });
        }
        catch (error) {
            console.log(error);
            return response.redirect("/home");
        }
        await Redis_1.default.setEx("verifikasi-user:" + request.user.id, 60 * 60 * 24, id);
        return response.redirect("/home");
    }
    async verifyPage(request, response) {
        const { id } = request.params;
        const verifikasi = await Redis_1.default.get("verifikasi-user:" + request.user.id);
        if (verifikasi == id) {
            await DB_1.default.from("users")
                .where("id", request.user.id)
                .update({ is_verified: true });
        }
        return response.redirect("/home?verified=true");
    }
    async logout(request, response) {
        if (request.cookies.auth_id) {
            await Authenticate_1.default.logout(request, response);
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=AuthController.js.map