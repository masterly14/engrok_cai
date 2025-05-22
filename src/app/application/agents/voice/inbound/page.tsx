import { getAllInboundAgents } from '@/actions/agents'
import { AgentsList } from '@/components/application/agents/agent-list'
import DehydratePage from '@/components/dehydratedPages'
import React from 'react'

const page = () => {
  return (
    <DehydratePage Querykey="agents" Queryfn={getAllInboundAgents}>
      <AgentsList type='inbound' />;
    </DehydratePage>
  )
}

export default page
