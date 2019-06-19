import {
    BIND_CURRENT_ORG,
    BIND_CURRENT_USER,
} from './mutation_types.js';

export default {
    [BIND_CURRENT_ORG](state, organization) {
        state.CURRENT.organizationId = organization.organizationID;
    },
    [BIND_CURRENT_USER](state, currentUser) {
        state.CURRENT.userId = currentUser.userID;
        state.CURRENT.userName = currentUser.userName;
    },
};