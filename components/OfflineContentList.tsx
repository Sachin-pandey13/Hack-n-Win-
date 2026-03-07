"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { setLesson, getLesson } from "@/lib/offlineStorage"
import { useLang } from "@/components/LanguageProvider"

type LessonMeta = {
  _id: string
  topic: string
  subject: string
  class: string
  fileName: string
  filePath: string
}

type Status = "idle" | "downloading" | "done" | "failed"

export default function OfflineContentList() {

  const { lang } = useLang()

  const [lessons, setLessons] = useState<LessonMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [perLessonStatus, setPerLessonStatus] = useState<Record<string, Status>>({})

  useEffect(() => {

    async function loadLessons() {
      try {
        const res = await fetch("/api/notes")
        const data = await res.json()

        setLessons(data)

        const map: Record<string, Status> = {}

        data.forEach((l: LessonMeta) => {
          map[l._id] = "idle"
        })

        setPerLessonStatus(map)

      } catch (err) {
        console.error("Failed to load notes", err)
      }

      setLoading(false)
    }

    loadLessons()

  }, [])

  async function downloadLesson(l: LessonMeta) {

    setPerLessonStatus(s => ({ ...s, [l._id]: "downloading" }))

    try {

      const res = await fetch(l.filePath)

      if (!res.ok) throw new Error("Download failed")

      const blob = await res.blob()

      const reader = new FileReader()

      reader.onload = async () => {
        await setLesson(l._id, reader.result)
        setPerLessonStatus(s => ({ ...s, [l._id]: "done" }))
      }

      reader.readAsDataURL(blob)

    } catch (err) {

      console.error(err)
      setPerLessonStatus(s => ({ ...s, [l._id]: "failed" }))

    }
  }

  if (loading) return <div>Loading lessons...</div>

  if (!lessons.length) return <div>No notes available.</div>

  return (

    <div>

      <h2 className="text-xl font-semibold mb-4">
        Offline Notes
      </h2>

      <ul className="space-y-3">

        {lessons.map((l) => {

          const s = perLessonStatus[l._id] ?? "idle"

          return (

            <li
              key={l._id}
              className="p-3 rounded-md bg-gray-900/60 flex items-center justify-between"
            >

              <div>

                <div className="font-semibold">
                  {l.topic}
                </div>

                <div className="text-sm text-gray-400">
                  Class {l.class} • {l.subject}
                </div>

              </div>

              <div className="flex gap-2">

                <Link
                  href={l.filePath}
                  target="_blank"
                  className="px-3 py-1 text-sm border rounded"
                >
                  Open
                </Link>

                <button
                  onClick={() => downloadLesson(l)}
                  disabled={s === "downloading"}
                  className="px-3 py-1 text-sm border rounded"
                >
                  {s === "downloading"
                    ? "Downloading..."
                    : s === "done"
                    ? "Downloaded"
                    : "Download"}
                </button>

              </div>

            </li>

          )

        })}

      </ul>

    </div>

  )

}