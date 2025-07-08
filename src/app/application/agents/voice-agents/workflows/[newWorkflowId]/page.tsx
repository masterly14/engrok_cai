"use client";
import React from "react";
import { FlowBuilder } from "../_components/flow-builder";
import { useParams } from "next/navigation";

const Page = () => {
  const params = useParams();
  const newWorkflowId = params.newWorkflowId as string;

  return (
    <main className="w-full h-screen flex flex-col p-0 m-0 overflow-hidden">
      <FlowBuilder workflowId={newWorkflowId} />
    </main>
  );
};

export default Page;
