import {
    BIND_CURRENT,
} from './mutation_types.js';

export default {
    [BIND_CURRENT](state, current) {
        if(current.userID) {
            state.CURRENT.userId = current.userID;
        }
        if(current.userName) {
            state.CURRENT.userName = current.userName;
        }
    },
};