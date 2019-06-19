import Utils from 'common/utils';

export default class Organizaton {
    constructor(row, isFromCache) {
        Utils.copyProperties(row, this);
		if(isFromCache) {
			return this;
		}
		
		this.id = row.organizationID.toString();
		this.name = row.name;
    }
}
Organizaton.typeName = 'Organizaton';
Organizaton.displayName = '机构';