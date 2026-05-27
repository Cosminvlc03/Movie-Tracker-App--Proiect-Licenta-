export const asset = (name) => `/misc/${name}`;

export const getPosterSrc = (posterPath) => {
  if (!posterPath) return asset("Film.svg");
  if (posterPath.startsWith("http")) return posterPath;
  return `https://image.tmdb.org/t/p/w200${posterPath}`;
};