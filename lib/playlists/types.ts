export type Language = "English" | "Hindi" | "Mixed"
export type Level = "Beginner" | "Intermediate" | "Advanced"

export type Category =
  | "Curriculum"
  | "Technical"
  | "Project"
  | "Trending"

export type Playlist = {
  id: string
  title: string
  provider: string

  topics: string[]
  language: Language
  level: Level
  description: string

  youtube:
    | { kind: "playlist"; playlistId: string }
    | { kind: "video"; videoId: string }

  thumbnail?: string

  category?: Category
  stream?: string | null
  career?: string | null
  subject?: string | null
  grade?: string | null

  prominence?: number
}