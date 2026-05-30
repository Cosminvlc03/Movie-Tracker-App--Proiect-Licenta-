import db from "../config/db.js";
import { getSessionCredentials } from "./authController.js";

export const searchUsers = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const { query } = req.query;
    if (!query) return res.json({ users: [] });
    const userResult = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const myId = userResult.rows[0].id;
    const sqlQuery = `
      SELECT id, username FROM users 
      WHERE username ILIKE $1 AND id != $2 
      AND id NOT IN (
        SELECT receiver_id FROM friendships WHERE sender_id = $2
        UNION 
        SELECT sender_id FROM friendships WHERE receiver_id = $2
      )
      LIMIT 10
    `;
    
    const result = await db.query(sqlQuery, [`%${query}%`, myId]);
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la căutarea utilizatorilor" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const { receiverId } = req.body;
    const senderResult = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const senderId = senderResult.rows[0].id;
    await db.query(
      "INSERT INTO friendships (sender_id, receiver_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [senderId, receiverId]
    );
    res.status(200).json({ message: "Cerere trimisă!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Nu am putut trimite cererea." });
  }
};

export const respondToRequest = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const { requestId, action } = req.body;
    const receiverResult = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const myId = receiverResult.rows[0].id;
    if (action === "rejected") {
      await db.query("DELETE FROM friendships WHERE id = $1 AND receiver_id = $2", [requestId, myId]);
      return res.json({ message: "Cerere respinsă" });
    }
    await db.query(
      "UPDATE friendships SET status = 'accepted' WHERE id = $1 AND receiver_id = $2",
      [requestId, myId]
    );
    res.json({ message: "Cerere acceptată!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la procesarea răspunsului." });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const userResult = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const myId = userResult.rows[0].id;
    const result = await db.query(
      "SELECT COUNT(*) FROM friendships WHERE receiver_id = $1 AND status = 'pending'", 
      [myId]
    );
    res.json({ pendingCount: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    res.status(500).json({ message: "Eroare notificări" });
  }
};

export const getFriendsData = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const userResult = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const myId = userResult.rows[0].id;
    const pendingQuery = `
      SELECT f.id as request_id, u.username 
      FROM friendships f 
      JOIN users u ON f.sender_id = u.id 
      WHERE f.receiver_id = $1 AND f.status = 'pending'
    `;
    const pendingResult = await db.query(pendingQuery, [myId]);
    const friendsQuery = `
      SELECT 
        u.username,
        (SELECT COUNT(*) FROM watchlist w WHERE w.user_id = u.id) as watchlist_count,
        (SELECT COUNT(*) FROM ratings r WHERE r.user_id = u.id) as ratings_count,
        (SELECT COUNT(*) FROM ratings r WHERE r.user_id = u.id AND comments IS NOT NULL AND TRIM(comments) != '') as comments_count,
        (
          SELECT COALESCE(json_agg(json_build_object('tmdb_id', m.tmdb_id, 'title', m.title, 'poster_path', m.poster_path)), '[]')
          FROM watchlist w
          JOIN media m ON w.movie_id = m.id
          WHERE w.user_id = u.id
        ) as watchlist_movies
      FROM users u
      WHERE u.id IN (
        SELECT sender_id FROM friendships WHERE receiver_id = $1 AND status = 'accepted'
        UNION
        SELECT receiver_id FROM friendships WHERE sender_id = $1 AND status = 'accepted'
      )
    `;
    const friendsResult = await db.query(friendsQuery, [myId]);
    res.json({
      pendingRequests: pendingResult.rows,
      acceptedFriends: friendsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Nu am putut încărca lista de prieteni." });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const { friendUsername } = req.body;
    const myResult = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const myId = myResult.rows[0].id;
    const friendResult = await db.query("SELECT id FROM users WHERE username = $1", [friendUsername]);
    if (friendResult.rows.length === 0) {
       return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }
    const friendId = friendResult.rows[0].id;
    await db.query(
      "DELETE FROM friendships WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)",
      [myId, friendId]
    );

    res.json({ message: "Utilizatorul a fost șters din lista de prieteni." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Eroare la eliminarea prietenului." });
  }
};