export const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_ROOMS":
      return {
        ...state,
        rooms: [...action.rooms],
      };
    case "ADD_ROOM":
      return {
        ...state,
        room: action.room.room,
        messages: action.room.messages,
        members: action.room.members
      };

      case "UPDATE_MEMBERS":
      return {
        ...state,
        members: action.members,
      };
      case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.message],
      };
      case "ROOM_LEAVE":
      return {
        ...state,
        messages: [],
        members: [],
        room: null
      };

      
    default:
      return state;
  }
};
