"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import { FlowBuilder } from '../_components/flow-buildex'

const Page = () => {
  const params = useParams()
  const workflowId = params.workflowId as string

  return (
    <main className="w-full h-screen flex flex-col p-0 m-0 overflow-hidden">
      <FlowBuilder workflowId={workflowId} />
    </main>
  )
}

export default Page