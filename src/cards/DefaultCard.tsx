import * as React from "react";
import styled from "styled-components";
import { SessionTypes } from "@walletconnect/types";
import { isJsonRpcRequest } from "@json-rpc-tools/utils";

import PulsingMethod from "../components/PulsingMethod";
import {Button, Flex, Input} from "@chakra-ui/react";

interface DefaultCardProps {
  accounts: string[];
  sessions: SessionTypes.Created[];
  requests: SessionTypes.RequestEvent[];
  openSession: (session: SessionTypes.Created) => void;
  openRequest: (requestEvent: SessionTypes.RequestEvent) => Promise<void>;
  openScanner: () => void;
  onURI: (data: any) => void;
}

const DefaultCard = (props: DefaultCardProps) => {
  const {
    accounts,
    sessions,
    requests,
    openSession,
    openRequest,
    openScanner,
    onURI,
  } = props;
  return (
    <Flex direction="column">
      <Flex direction="column">
        <Button onClick={openScanner}>{`Scan`}</Button>
        <p>{"OR"}</p>
        <Input onChange={(e: any) => onURI(e.target.value)} placeholder={"Paste wc: uri"} />
      </Flex>
      {!!sessions.length ? (
        <>
          <h6>{"Sessions"}</h6>
          {sessions.map(session => (
            <Flex key={session.topic} onClick={() => openSession(session)}>
              <img src={session.peer.metadata.icons[0]} alt={session.peer.metadata.name} />
              <div>{session.peer.metadata.name}</div>
            </Flex>
          ))}
          {requests.length && (
            <>
              <h6>{"Requests"}</h6>
              {requests.map(requestEvent =>
                isJsonRpcRequest(requestEvent.request) ? (
                  <PulsingMethod
                    key={`default:request:${requestEvent.request.id}`}
                    onClick={() => openRequest(requestEvent)}
                  >
                    <div>{requestEvent.request.method}</div>
                  </PulsingMethod>
                ) : null,
              )}
            </>
          )}
        </>
      ) : null}
    </Flex>
  );
};
export default DefaultCard;
