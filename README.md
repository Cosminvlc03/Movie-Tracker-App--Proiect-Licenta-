# Movie-Tracker-App--Proiect-Licenta-

1. Description:
- This application is meant to work as a mix of multiple existing platforms i.e. Netflix, TMDB, IMDB, etc.
- Users can create an account, search for different movies, and create personal wishlists.
- As such, the app is meant centralize multiple features, and add features absent from mentioned platforms.
- Main future features will include:
  - AI chatbot to ask for recommendations;
  - rating system so users can leave ratings and see a mean of those ratings;
  - capability to leave comments on movies;

2. Technical Section:
The stack I used is as follows:
- For FE -> React(+HTML5 & CSS3);
- For BE -> Node.js + Express.js;
- For DB -> PostgreSQL;
In the "design" folder you will be able to find the base design I made for the website + the link to the Figma Schema.
The TMDB API is used to call for the content the user wants, as such an API key is needed.
Under the public/misc you can also find the commands needed to create the DB in PostgreSQL. An account is needed.
The necessary keys for the .env files are:
    - API_KEY
    - DB_PASS
    - DB_USER
    - DB_HOST
    - DB_NAME
    - DB_PORT
    - SESSION_SECRET
 
3. Installation:
- Clone the repository (using "git clone [repo link]" or from GitHub itself);
- In the root folder run "npm install all" in the terminal;
- Create a .env file with the keys mentioned previously;
- Run the given SQL script in PostgreSQL;
- Run the "npm run dev" command;

4. Extra Info:
- This repo is meant to be a continuation of the same app that can be found in the web development portfolio repo.
- Any of the old commits can be found in that repo.
- There you can also find the old version, that uses EJS files instead of using React.
- Further implementations will take place in THIS repository.
