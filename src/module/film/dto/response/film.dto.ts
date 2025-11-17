export class FilmResponseDto {
  id: string;
  title: string;
  description: string;
  poster: string;
  views: number;
  rating: number;
  releaseDate: Date | null;
}
