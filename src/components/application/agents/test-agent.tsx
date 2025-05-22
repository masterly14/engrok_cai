import React from "react";

type Props = {
  elevenlabs_agent_id: string;
  twilio_account_sid: string;
  twilio_phone_number: string;
  number: string;
  prompt: string;
  first_message: string;
};

const TestAgent = ({elevenlabs_agent_id, twilio_account_sid, twilio_phone_number, first_message, prompt, number}: Props) => {

  return <div>TestAgent</div>;
};

export default TestAgent;
