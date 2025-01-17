import type { ICreateClientOpts } from 'matrix-js-sdk';
import { createClient as createMatrixClient } from 'matrix-js-sdk';

// Re-export types
export type {
  AuthDict,
  ILoginFlowsResponse,
  IRegisterRequestParams,
  IRequestTokenResponse,
  MatrixClient,
  Room,
  RoomMember,
} from 'matrix-js-sdk';

// Re-export values
export {
  ClientEvent,
  Direction,
  EventStatus,
  EventType,
  MatrixEvent,
  MsgType,
  Preset,
  RelationType,
  RoomEvent,
  RoomMemberEvent,
  SyncState,
  TimelineWindow,
  Visibility,
} from 'matrix-js-sdk';

// Create a Matrix client instance with our configuration
export const createClient = (config: {
  baseUrl: string;
  accessToken?: string;
  userId?: string;
  device_id?: string;
}) => {
  const clientConfig: ICreateClientOpts & { cryptoRuntime?: { name: string } } = {
    ...config,
    useAuthorizationHeader: true,
    // Force use of pure JavaScript crypto implementation
    cryptoRuntime: {
      name: 'js',
    },
  };

  return createMatrixClient(clientConfig);
};
