import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "../config/db.js";
import { searchAndGetDetails } from "./mediaController.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chatWithAI = async (req, res) => {
  try {
    const { message, history, language } = req.body;
    const username = req.session.username;
    if (!username) {
      return res.status(401).json({ message: "Neautorizat" });
    }
    const userResult = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const userId = userResult.rows[0].id;

    const watchlistData = await db.query(
      "SELECT m.title FROM watchlist w JOIN media m ON w.movie_id = m.id WHERE w.user_id = $1",
      [userId]
    );
    const ratingsData = await db.query(
      "SELECT m.title, r.rating FROM ratings r JOIN media m ON r.movie_id = m.id WHERE r.user_id = $1",
      [userId]
    );

    const watchlistMovies = watchlistData.rows.map(row => row.title).join(", ");
    const ratedMovies = ratingsData.rows.map(row => `"${row.title}" (Nota: ${row.rating}/10)`).join(", ");

    // Detectăm limba
    const isRomanian = language.toLowerCase().includes('ro');

    // Definim șabloanele complet traduse
    const promptRO = `
      Ești un expert în cinematografie, pasionat, prietenos și asistentul virtual al platformei MyMovieTracker.
      Scopul tău este să oferi recomandări de filme și să discuți cu utilizatorul exclusiv despre filme, seriale, actori și regizori.
      Dacă ești întrebat despre alte subiecte, refuză politicos și readu discuția la filme.

      Aici este contextul secret despre utilizator:
      - Filme salvate în watchlist: ${watchlistMovies || "Nu are filme salvate încă."}
      - Filme evaluate: ${ratedMovies || "Nu a lăsat nicio notă încă."}

      Reguli de comunicare:
      1. Tonul tău: Cald, entuziast și natural, ca un prieten cu care vorbești despre filme.
      2. Lungimea: Oferă răspunsuri scurte (1-2 paragrafe a câte 2-3 propoziții).
      3. Recomandări: Când propui filme, oferă 2-3 opțiuni și explică scurt de ce i s-ar potrivi.
      4. Discreție: Nu spune "din baza mea de date". Vorbește natural.
    `;

    const promptEN = `
      You are an expert in cinematography, passionate, friendly, and the virtual assistant of the MyMovieTracker platform.
      Your goal is to provide movie recommendations and discuss exclusively movies, series, actors, and directors with the user.
      If asked about other topics, politely refuse and steer the conversation back to movies.

      Here is the secret context about the user:
      - Movies saved in watchlist: ${watchlistMovies || "Has no movies saved yet."}
      - Movies rated: ${ratedMovies || "Has not left any ratings yet."}

      Communication rules:
      1. Your tone: Warm, enthusiastic, and natural, like a friend discussing movies.
      2. Length: Provide short to medium answers (1-2 paragraphs, 2-3 sentences each). 
      3. Recommendations: When suggesting movies, offer 2-3 options and briefly explain why they would fit the user.
      4. Discretion: Never say "from my database" or "from the provided text". Speak as if you already know these things about them.
    `;

    // Alegem promptul corect
    const systemPrompt = isRomanian ? promptRO : promptEN;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite",
      systemInstruction: systemPrompt 
    });

    let formattedHistory = (history || []).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift(); 
    }

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    res.json({ reply: responseText });

  } catch (error) {
    console.error("Eroare la comunicarea cu AI-ul:", error);
    res.status(500).json({ message: "Asistentul AI este momentan indisponibil." });
  }
};

export const getAIRecommendations = async (req, res) => {
  try {
    const username = req.session.username;
    if (!username) return res.status(401).json({ message: "Neautorizat" });

    const userResult = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const userId = userResult.rows[0].id;
    const watchlistData = await db.query(
      "SELECT m.title FROM watchlist w JOIN media m ON w.movie_id = m.id WHERE w.user_id = $1",
      [userId]
    );

    const hasMovies = watchlistData.rows.length > 0;
    const watchlistMovies = watchlistData.rows.map(row => row.title).join(", ");
    let systemPrompt = "";
    
    if (hasMovies) {
      systemPrompt = `
        Ești un sistem de recomandări de filme. 
        Analizează această listă de filme pe care utilizatorul le-a salvat deja: ${watchlistMovies}.
        Returnează EXACT 6 recomandări noi de filme care se potrivesc cu gusturile lui. 
        NU recomanda filme care sunt deja în lista lui!
      `;
    } else {
      systemPrompt = `
        Ești un sistem de recomandări de filme. Utilizatorul este la început și nu a salvat niciun film.
        Returnează EXACT 6 filme extrem de populare, capodopere universale (ex: Inception, Interstellar, The Godfather) pentru a-i forma un "Starter Pack".
      `;
    }
    systemPrompt += `
      Trebuie să răspunzi STRICT cu un array JSON valid care conține 6 obiecte.
      Fiecare obiect trebuie să aibă exact această cheie:
      - "title": official movie title in English

      IMPORTANT:
      - Return ONLY English movie titles.
      - Do not translate movie names.
      - Do not include any explanations.
      - Do not add any text before or after the JSON array.
    `;
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite",
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Generează recomandările." }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const recommendationsJSON = JSON.parse(result.response.text());
    const enrichedRecommendations = [];

    for (const rec of recommendationsJSON) {
      const tmdbDataArray = await searchAndGetDetails(rec.title, 1, "en-US");
      if (tmdbDataArray && tmdbDataArray.length > 0) {
        const tmdbMovie = tmdbDataArray[0];
        enrichedRecommendations.push({
          id: tmdbMovie.id,
          title: tmdbMovie.title,
          photo: tmdbMovie.photo,
          year: tmdbMovie.releaseYear,
          reason: rec.reason
        });
      }
    }
    res.json({ 
      isPersonalized: hasMovies, 
      recommendations: enrichedRecommendations 
    });
  } catch (error) {
    console.error("Eroare la generarea recomandărilor:", error);
    res.status(500).json({ message: "Eroare la generarea recomandărilor." });
  }
};