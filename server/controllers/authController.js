import db from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { z } from "zod";
import { getWatchlist } from "./mediaController.js"; 

export const getSessionCredentials = (req) => {
  return {
    username: req.session.username,
  };
};

export const checkSession = async (req, res) => {
  if (!req.session?.isAuthenticated) {
    return res.json({ isAuthenticated: false });
  }
  const { username } = getSessionCredentials(req);
  const watchlist = await getWatchlist(username);
  res.json({ isAuthenticated: true, username, watchlist });
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    req.session.isAuthenticated = true;
    req.session.username = user.username;
    const watchlist = await getWatchlist(username);
    res.json({ username, watchlist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

export const signup = async (req, res) => {
  const signupSchema = z.object({
    username: z.string().min(3, "Username-ul trebuie să aibă minim 3 caractere."),
    email: z.string().email("Format de email invalid."),
    password: z.string()
      .min(8, "Parola trebuie să aibă minim 8 caractere.")
      .regex(/[A-Z]/, "Parola trebuie să conțină cel puțin o literă mare.")
      .regex(/[0-9]/, "Parola trebuie să conțină cel puțin o cifră.")
  });
  const validationResult = signupSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ message: validationResult.error.issues[0].message });
  }
  const { username, email, password } = validationResult.data;
  try {
    const existingUser = await db.query(
      "SELECT id FROM users WHERE mail = $1 OR username = $2", 
      [email, username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Username-ul sau adresa de email sunt deja folosite." });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await db.query("INSERT INTO users (username, mail, password) VALUES ($1, $2, $3)", [
      username, email, hashedPassword
    ]);
    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("Database error during signup:", err);
    res.status(500).json({ message: "Account creation failed" });
  }
};

export const recoverPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await db.query("SELECT id, username FROM users WHERE mail = $1", [email]);
    if (result.rows.length === 0) {
      return res.json({ message: "Dacă adresa există în sistem, a fost trimis un email de resetare." });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await db.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
      [resetToken, tokenExpiry, user.id]
    );
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
    const info = await transporter.sendMail({
      from: '"MyMovieTracker Support" <support@mymovietracker.com>',
      to: email,
      subject: "Password Reset Request",
      text: `Salut ${user.username}, accesează acest link pentru a-ți reseta parola: ${resetLink}`,
      html: `
        <div style="font-family: sans-serif; color: #02182B;">
          <h2>Salutare, ${user.username}!</h2>
          <p>Am primit o cerere de resetare a parolei pentru contul tău.</p>
          <p>Accesează link-ul de mai jos pentru a alege o parolă nouă. Link-ul este valabil 15 minute.</p>
          <a href="${resetLink}" style="background: #1E7170; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Resetează Parola</a>
          <p>Dacă nu ai cerut acest lucru, poți ignora liniștit acest email.</p>
        </div>
      `,
    });
    console.log("Preview Email trimis aici: %s", nodemailer.getTestMessageUrl(info));
    res.json({ message: "Dacă adresa există în sistem, a fost trimis un email de resetare." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la procesarea cererii de recuperare." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await db.query(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Token invalid sau expirat. Te rugăm să ceri un nou link de resetare." });
    }
    const userId = result.rows[0].id;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await db.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [hashedPassword, userId]
    );

    res.json({ message: "Parola a fost resetată cu succes! Te poți autentifica." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la resetarea parolei." });
  }
};

export const getAccount = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const result = await db.query("SELECT mail FROM users WHERE username = $1", [username]);
    const items = result.rows[0];
    res.json({ username, mail: items.mail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load account" });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Eroare la distrugerea sesiunii:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out" });
  });
};