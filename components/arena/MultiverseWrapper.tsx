"use client"

import dynamic from "next/dynamic"

const Scene = dynamic(() => import("./Multiverse3D"), {
  ssr: false,
})

export default function MultiverseWrapper(props: any) {
  return <Scene {...props} />
}