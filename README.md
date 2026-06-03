# Movie-Tracker-App--Proiect-Licenta-

1. Description:
- This application is meant to work as a mix of multiple existing platforms i.e. Netflix, TMDB, IMDB, etc.
- Users can :
  - create an account and manage it; 
  - search for different movies and get details about them;
  - create personal watchlists that they can manage;
  - leave ratings and see a mean of those ratings;
  - leave comments on movies and see other movies;
  - watch trailers;
  - search for friends, add them and see their watchlists;
  - AI chatbot to ask about movies;
  - Recommendation system;
  - login as admin, see users/movies stats and graphs, as well as exporting the data and managing users
- As such, the app is meant centralize multiple features, and add features absent from mentioned platforms.

2. Technical Section:
The stack I used is as follows:
- For FE -> React(+HTML5 & CSS3);
- For BE -> Node.js + Express.js;
- For DB -> PostgreSQL;
The TMDB API is used to call for the content the user wants, as such an API key is needed.
Under the "db_script" folder you can also find the commands needed to create the DB in PostgreSQL. An account is needed.
The necessary keys for the .env files are:
    - API_KEY
    - DB_PASS
    - DB_USER
    - DB_HOST
    - DB_NAME
    - DB_PORT
    - SESSION_SECRET
    - GEMINI_API_KEY
 
3. Installation:
- Clone the repository (using "git clone [repo link]" or from GitHub itself);
- In the root folder run "npm install all" in the terminal;
- Create a .env file with the keys mentioned previously;
- Run the given SQL script in PostgreSQL;
- Run the "npm run dev" command in the terminal, both in the server folder and client folder;

4. Extra Info:
- This repo is meant to be a continuation of the same app that can be found in the web development portfolio repo.
- Any of the old commits can be found in that repo.
- There you can also find the old version, that uses EJS files instead of using React.
- Further implementations will take place in THIS repository.
- When using the admin page, make sure to run the Update line in PostgreSQL to update the specific user to an admin role.