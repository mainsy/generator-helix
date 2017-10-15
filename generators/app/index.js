var yeoman = require('yeoman-generator');
var mkdir = require('mkdirp');
var yosay = require('yosay');
var guid = require('uuid');
var path = require('path');
const util = require('./utility');

module.exports = class extends yeoman {

	constructor(args, opts) {
		super(args, opts);

		this.option('solutionName', { 
			type: String, 
			required: false, 
			desc: 'the name of the Helix solution' 
		});
	}

	init() {
		this.log(yosay('Yo welcome to the Helix Generator which was originally created by Pentia, but was ripped off by Paul!'));
		this.templatedata = {};
	}

	askForSolutionType() {
		var questions = [{
			type: 'list',
			name: 'SolutionType',
			message: 'What type of solution do you want to create?',
			choices: [{
				name: 'Empty Helix solution',
				value: 'emptyhelix'
			},{
				name: 'Full Helix solution',
				value: 'fullhelix'
			}]
		}, {
			type: 'confirm',
			name: 'installDeps',
			message: 'Would you like to auto download dependencies?',
			default: true,
			when: function(answers) {
				return answers.SolutionType === 'fullhelix';
			}
		},{
			type: 'confirm',
			name: 'installCommon',
			message: 'Would you like to add a common project (for multi tennant use)?',
			default: true,
			when: function(answers){
				return answers.SolutionType === 'fullhelix';
			}
		}];

		var done = this.async();

		this.prompt(questions).then(function(answers) {
			this.type = answers.SolutionType;
			this.installDeps = answers.installDeps;
			this.installCommon = answers.installCommon;
			done();
		}.bind(this));
	}

	askForSolutionSettings() {
		var questions = [{
			type: 'input',
			name: 'SolutionName',
			message: 'Name of your Helix solution',
			default: this.appname
		},{
			type:'input',
			name:'sourceFolder',
			message:'Source code folder name', 
			default: 'src',
			store: true
		}];

		var done = this.async();
		this.prompt(questions).then(function(answers) {
			this.settings = answers;
			this.sourceFolder = answers.sourceFolder;
			this.SolutionName = answers.SolutionName;
			done();
		}.bind(this));
	}

	askTargetFrameworkVersion() {
		var questions = [{
			type: 'list',
			name: 'target',
			message: 'Choose target .net framework version',
			choices: util.getTargets,
			store: true
		}];

		var done = this.async();
		this.prompt(questions).then(function(answers) {
			this.target = answers.target;
			done();
		}.bind(this));
	}

	askSitecoreVersion(){
		var questions = [{
			type: 'list',
			name: 'sitecoreversion',
			message: 'Choose Sitecore version',
			choices: util.getSitecoreVersions,
			store: true
		}];

		var done = this.async();
		this.prompt(questions).then(function(answers){
			this.sitecoreversion = answers.sitecoreversion;
			done();
		}.bind(this));
	}

	askSiteUrl() {
		var questions = [{
			type: 'input',
			name: 'LocalWebsiteUrl',
			message: 'Enter the local website URL',
			default: 'http://'+ this.settings.SolutionName + '.local'
		}];

		var done = this.async();
		this.prompt(questions).then(function(answers) {
			this.localWebsiteUrl = answers.LocalWebsiteUrl;
			this._buildTemplateData();
			done();
		}.bind(this));
	}

	_buildTemplateData() {
		this.templatedata.solutionname = this.settings.SolutionName;
		this.templatedata.environmentguid = guid.v4();
		this.templatedata.environmentfolderguid = guid.v4();
		this.templatedata.projectguid = guid.v4();
		this.templatedata.featureguid = guid.v4();
		this.templatedata.foundationguid = guid.v4();
		this.templatedata.sourceFolder = this.settings.sourceFolder;
		this.templatedata.target = this.target;
		this.templatedata.sitecoreversion = this.sitecoreversion;
		this.templatedata.targetnoprefix = this.target.replace('v', '');
		this.templatedata.localwebsiteurl = this.localWebsiteUrl;
	}

	_writeLayers() {
		var layers = [ 'Project', 'Feature', 'Foundation'];
			
		for (var i = 0; i < layers.length; i++) {
				
			var destinationDirectory = path.join(this.settings.sourceFolder,layers[i]);
			mkdir.sync(destinationDirectory);

			var layer = layers[i];
			var layerDocumentationFileName = layer + '/' + layer + '-layer.md';
			var destinationFileName = path.join(this.destinationPath(destinationDirectory), layer + '-layer.md');
			this.fs.copy(
				this.templatePath(layerDocumentationFileName),
				this.destinationPath(destinationFileName));
		}
	}

	_copyEmptySolutionItems() {
		this.fs.copyTpl(
			this.templatePath('_emptySolution.sln'),
			this.destinationPath(this.settings.SolutionName + '.sln'),
			this.templatedata);
	}

	_copyTemplateFile(template, destination) {
		this.fs.copyTpl(
			this.templatePath(template),
			this.destinationPath(destination),
			this.templatedata
		);
	}

	_copyToProject(template, layer, project, destination){
		var projectDestination = path.join(this.settings.sourceFolder, layer, project, 'code');
		this._copyTemplateFile(template, path.join(projectDestination, destination));
	}

	_copySolutionItems(){
		this._copyTemplateFile('_gulpfile.js', 'gulpfile.js');
		this._copyTemplateFile('_solution.sln', this.settings.SolutionName + '.sln');
		this._copyTemplateFile('_package.json', 'package.json');
		this._copyTemplateFile('_publishsettings.targets', 'publishsettings.targets');
		this._copyTemplateFile('_solution-config.json', 'solution-config.json');
	}

	_copyCommonItems(template, destination){
		if(this.settings.installCommon){
			var commonDestination = path.join(this.settings.sourceFolder, 'Project/Common/code');
			this._copyTemplateFile(template,path.join(commonDestination, destination));
			mkdir.sync(path.join(this.settings.sourceFolder, 'Project/Common/code/Properties'));
			this._copyToProject('Project/Common/web.config', 'Project', 'Common', 'web.config');
			this._copyToProject('Project/Common/packages.config', 'Project', 'Common', 'packages.config');
			this._copyToProject('Project/Common/Properties/AssemblyInfo.cs', 'Project', 'Common', 'Properties/AssemblyInfo.cs');
			this._copyToProject('Project/Common/Properties/PublishProfiles/local.pubxml', 'Project', 'Common', 'Properties/PublishProfiles/local.pubxml');
			this._copyToProject('Project/Common/Project.Environment.csproj', 'Project', 'Common', 'Project.Common.csproj');
		}
	}

	writing() {
		this._writeLayers();
		switch (this.type) {
		case 'emptyhelix':
			this._copyEmptySolutionItems();
			break;
		case 'fullhelix':
			this._copyAllAssets();
			break;
		}
	}

	installDependencies() {
		if (this.type === 'fullhelix' && this.installDeps) {
			this.npmInstall();
		}
	}
};
