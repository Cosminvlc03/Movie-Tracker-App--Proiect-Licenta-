import db from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const usersCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
    const moviesCount = await db.query("SELECT COUNT(*) FROM watchlist");
    const reviewsCount = await db.query("SELECT COUNT(*) FROM ratings");

    const topPopularQuery = `
      SELECT m.title, COUNT(w.movie_id) as count
      FROM media m
      JOIN watchlist w ON m.id = w.movie_id
      GROUP BY m.id, m.title
      ORDER BY count DESC
      LIMIT 5
    `;
    const topPopularResult = await db.query(topPopularQuery);

    const topRatedQuery = `
      SELECT m.title, 
            ROUND(AVG(r.rating), 1) as rating, 
            COUNT(r.id) as review_count
      FROM media m
      JOIN ratings r ON m.id = r.movie_id
      GROUP BY m.id, m.title
      HAVING COUNT(r.id) > 0 
      ORDER BY rating DESC, review_count DESC
      LIMIT 5
    `;
    const topRatedResult = await db.query(topRatedQuery);

    const usersTimelineQuery = `
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM users
      WHERE role = 'user' AND created_at IS NOT NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 30
    `;
    const usersTimelineResult = await db.query(usersTimelineQuery);

    const reviewsTimelineQuery = `
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM ratings
      WHERE created_at IS NOT NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
      LIMIT 30
    `;
    const reviewsTimelineResult = await db.query(reviewsTimelineQuery);

    res.json({
      kpis: {
        totalUsers: parseInt(usersCount.rows[0].count, 10),
        totalMovies: parseInt(moviesCount.rows[0].count, 10),
        totalReviews: parseInt(reviewsCount.rows[0].count, 10)
      },
      topMoviesPopularity: topPopularResult.rows.map(row => ({ 
        name: row.title, 
        count: parseInt(row.count, 10) 
      })),
      topMoviesRated: topRatedResult.rows.map(row => ({ 
        name: row.title, 
        rating: parseFloat(row.rating),
        count: parseInt(row.review_count, 10) // Adăugăm numărul de review-uri aici
})),
      usersTimeline: usersTimelineResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count, 10)
      })),
      reviewsTimeline: reviewsTimelineResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count, 10)
      }))
    });

  } catch (err) {
    console.error("Eroare la extragerea statisticilor de admin:", err);
    res.status(500).json({ message: "Eroare la încărcarea statisticilor." });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, TO_CHAR(created_at, 'DD/MM/YYYY') as join_date FROM users WHERE role = 'user' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Eroare la extragerea utilizatorilor." });
  }
};

export const deleteUserAsAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    await db.query("BEGIN");
    await db.query("DELETE FROM friendships WHERE sender_id = $1 OR receiver_id = $1", [userId]);
    await db.query("DELETE FROM watchlist WHERE user_id = $1", [userId]);
    await db.query("DELETE FROM ratings WHERE user_id = $1", [userId]);
    await db.query("DELETE FROM users WHERE id = $1 AND role = 'user'", [userId]);
    await db.query(`
      DELETE FROM media 
      WHERE id NOT IN (SELECT movie_id FROM watchlist) 
      AND id NOT IN (SELECT movie_id FROM ratings)
    `);
    await db.query("COMMIT");
    res.json({ message: "Utilizatorul, datele sale și filmele orfane au fost șterse." });
  } catch (err) {
    await db.query("ROLLBACK"); 
    console.error("Eroare la ștergerea utilizatorului:", err);
    res.status(500).json({ message: "Eroare la ștergerea contului." });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    const query = `
      SELECT r.id, r.rating, r.comments, TO_CHAR(r.created_at, 'DD/MM/YYYY HH24:MI') as date,
             u.username, m.title as movie_title
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      JOIN media m ON r.movie_id = m.id
      WHERE r.comments IS NOT NULL AND TRIM(r.comments) != ''
      ORDER BY r.created_at DESC
      LIMIT 50
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Eroare la extragerea recenziilor:", err);
    res.status(500).json({ message: "Eroare la extragerea recenziilor." });
  }
};

export const deleteReviewAsAdmin = async (req, res) => {
  try {
    const { reviewId } = req.params;
    await db.query("DELETE FROM ratings WHERE id = $1", [reviewId]);
    res.json({ message: "Recenzia a fost ștearsă cu succes." });
  } catch (err) {
    console.error("Eroare la ștergerea recenziei:", err);
    res.status(500).json({ message: "Eroare la ștergerea recenziei." });
  }
};