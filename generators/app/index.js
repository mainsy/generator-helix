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
		},{
			type: 'confirm',
			name: 'installWebsite',
			message: 'Would you like to add a project website (project with the same name as the solution?',
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
			this.installWebsite = answers.installWebsite;
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
		this.templatedata.date = new Date().getFullYear();
		this.templatedata.commonguid = guid.v4();
		this.templatedata.commonfolderguid = guid.v4();
		this.templatedata.websiteguid = guid.v4();
		this.templatedata.websitefolderguid = guid.v4();
		this.templatedata.configguid = guid.v4();
		this.templatedata.projectguid = guid.v4();
		this.templatedata.featureguid = guid.v4();
		this.templatedata.foundationguid = guid.v4();
		this.templatedata.specguid = guid.v4();
		this.templatedata.unittestguid = guid.v4();
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

	_copyAllItems(){
		this._copySolutionItems();
		this._copyCommonItems();
		this._copyWebsiteItems();
	}

	_copySolutionItems(){
		this._copyTemplateFile('_gulpfile.js', 'gulpfile.js');
		this._copyTemplateFile('_solution.sln', this.settings.SolutionName + '.sln');
		this._copyTemplateFile('_package.json', 'package.json');
		this._copyTemplateFile('_publishsettings.targets', 'publishsettings.targets');
		this._copyTemplateFile('_solution-config.json', 'solution-config.json');
	}

	_copyCommonItems(){
		if(this.installCommon){
			mkdir.sync(path.join(this.settings.sourceFolder, 'Project/Common/code/Properties'));
			mkdir.sync(path.join(this.settings.sourceFolder, 'Project/Common/code/Areas/Common/Models'));
			mkdir.sync(path.join(this.settings.sourceFolder, 'Project/Common/code/Areas/Common/Controllers'));
			mkdir.sync(path.join(this.settings.sourceFolder, 'Project/Common/code/Areas/Common/Views'));
	
			this.fs.copyTpl(
				this.templatePath('Project/Common/Views/web.config'),
				this.destinationPath(path.join(this.settings.sourceFolder, 'Project/Common/code/Areas/Common/Views/web.config')), 
				this.templatedata);

			this.fs.copyTpl(
				this.templatePath('Project/Common/Properties/AssemblyInfo.cs'),
				this.destinationPath(
					path.join(this.settings.sourceFolder, 'Project/Common/code/Properties/AssemblyInfo.cs')),
					this.templatedata);

			this._copyToProject('Project/Common/packages.config', 'Project', 'Common', 'packages.config');
			this._copyToProject('Project/Common/Properties/PublishProfiles/local.pubxml', 'Project', 'Common', 'Properties/PublishProfiles/local.pubxml');
			this._copyToProject('Project/Common/Web.config', 'Project', 'Common', 'Web.config');
			this._copyToProject('Project/Common/Project.Common.Website.csproj', 'Project', 'Common', 'Project.Common.Website.csproj');
		}
	}

	_copyWebsiteItems(){
		if(this.installWebsite){
			mkdir.sync(path.join(this.settings.sourceFolder, 'Project', this.settings.SolutionName, 'code/Properties'));
			mkdir.sync(path.join(this.settings.sourceFolder, 'Project', this.settings.SolutionName, 'code/Areas', this.settings.SolutionName ,'Models'));
			mkdir.sync(path.join(this.settings.sourceFolder, 'Project', this.settings.SolutionName, 'code/Areas', this.settings.SolutionName ,'Controllers'));
			mkdir.sync(path.join(this.settings.sourceFolder, 'Project', this.settings.SolutionName, 'code/Areas', this.settings.SolutionName ,'Views'));
	
			this.fs.copyTpl(
				this.templatePath('Project/Website/Views/web.config'),
				this.destinationPath(
					path.join(this.settings.sourceFolder, 'Project', this.settings.SolutionName, 'code/Areas', this.settings.SolutionName ,'Views/web.config')), 
					this.templatedata);

			this.fs.copyTpl(
				this.templatePath('Project/Website/Properties/AssemblyInfo.cs'),
				this.destinationPath(
					path.join(this.settings.sourceFolder, 'Project', this.settings.SolutionName, '/code/Properties/AssemblyInfo.cs')),
					this.templatedata);

			this._copyToProject('Project/Website/packages.config', 'Project', this.settings.SolutionName, 'packages.config');
			this._copyToProject('Project/Website/Properties/AssemblyInfo.cs', 'Project', this.settings.SolutionName, 'Properties/AssemblyInfo.cs');
			this._copyToProject('Project/Website/Properties/PublishProfiles/local.pubxml', 'Project', this.settings.SolutionName, 'Properties/PublishProfiles/local.pubxml');
			this._copyToProject('Project/Website/Web.config', 'Project', this.settings.SolutionName, 'Web.config');
			this._copyToProject('Project/Website/Project.Website.csproj', 'Project', this.settings.SolutionName, 'Project.' + this.settings.SolutionName + '.csproj');
		}
	}

	writing() {
		this._writeLayers();
		switch (this.type) {
		case 'emptyhelix':
			this._copyEmptySolutionItems();
			break;
		case 'fullhelix':
			this._copyAllItems();
			break;
		}
	}

	installDependencies() {
		if (this.type === 'fullhelix' && this.installDeps) {
			this.npmInstall();
		}
	}
};
