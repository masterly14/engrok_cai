import { getAgentWithContacts } from "@/actions/conversations";
import { ChatInterface } from "./_components/ChatInterface";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ agentId: string }>;
};

const ConversationPage = async ({ params }: Props) => {
  // Next 15: params is now a Promise
  const { agentId } = await params;

  const agentWithContacts = await getAgentWithContacts(agentId);

  if (!agentWithContacts) {
    return notFound();
  }

  return (
    <ChatInterface
      agent={agentWithContacts}
      contacts={agentWithContacts.chatContacts}
    />
  );
};

export default ConversationPage;
