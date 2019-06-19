import BaseService from 'service/base_service';

import Organizaton from 'model/organization';

export default class UserService extends BaseService {

    /**
     * 获取当前用户所在的机构
     */
    getMyOrganizations(params, callbacks) {
        return this.queryTemplate(params, callbacks, {
            ajaxParams: {
                action: 'getMyOrganizations',
                name: params.name,
            },
            objType: Organizaton,
            errorTag: 'getMyOrganizations',
            errorMsg: '获取我所在的机构信息失败',
        });
    }

    /**
     * 根据ID获取某个机构的信息
     */
    getOrganizationByID(params, callbacks) {
        return this.queryTemplate(params, callbacks, {
            ajaxParams: {
                action: 'getOrganizationByID',
                organizationID: params.organizationId,
            },
            objType: Organizaton,
            errorTag: 'getOrganizationByID',
            errorMsg: '获取某个机构的信息失败',
        });
    }

    /**
     * 获取当前用户的对象
     */
    getMyObj(params, callbacks) {
        return this.queryTemplate(params, callbacks, {
            ajaxParams: {
                action: 'getMyObj',
                objID: params.objId,
            },
            singleResult: true,
            model: {
                idKey: 'objID',
                nameKey: 'name',
            },
            errorTag: 'getMyObj',
            errorMsg: '获取我的对象信息失败',
        });
    }
};