const chalk = require('chalk');

function getTargets() {
return [{
			name: '.net 4.7',
			value: 'v4.7'
		}, {
			name: '.net 4.6.2',
			value: 'v4.6.2'
		}, {
			name: '.net 4.6.1',
			value: 'v4.6.1'
		}, {
			name: '.net 4.6',
			value: 'v4.6'
		}, {
			name: '.net 4.5.2',
			value: 'v4.5.2'
		}
	];
}

function getSitecoreVersions(){
	return [{
		name: '8.2 Update 5',
		value: '8.2.170728'
	},{
		name: '8.2 Update 4',
		value: '8.2.170614'
	},{
		name: '8.2 Update 3',
		value: '8.2.170407'
	},{
		name: '8.2 Update 2',
		value: '8.2.161221'
	},{
		name: '8.2 Update 1',
		value: '8.2.161115'
	},{
		name: '8.2 Initial Release',
		value: '8.2.160729'
	}];
}

function validateRequired(input, msg) {
	return !input ? msg : true;
}

function validateProjectName(input) {
	return validateRequired(input, chalk.red('You must provide a name for your project'));
}

module.exports = {
	getTargets: getTargets,
	getSitecoreVersions: getSitecoreVersions,
	validateProjectName: validateProjectName
};