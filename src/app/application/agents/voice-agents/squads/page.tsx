"use client";

import dynamic from "next/dynamic";
import React from "react";

// React Flow uses window, so we need dynamic import with ssr false
const SquadsAgentsClient = dynamic(() => import("./_components/SquadsAgentsClient"), { ssr: false });

const SquadsPage = () => {
  return <SquadsAgentsClient />;
};

export default SquadsPage;
