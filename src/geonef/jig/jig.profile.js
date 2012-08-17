var profile = (function()
{
  var testResourceRe = /^geonef\/jig\/test\//;

  var copyOnly = function(filename, mid) {
    var list = {
      "geonef/jig/jig.profile":1,
      "geonef/jig/package.json":1,
    };

    return (mid in list) || (/^geonef\/jig\/resources\//.test(mid) && !/\.css$/.test(filename)) || /(png|jpg|jpeg|gif|tiff)$/.test(filename);
  };

  var excludes = [
    "_Serializable",
    "button/Action",
    "button/InstanciateAnchored",
    "button/Link",
    "button/Submit",
    "button/TooltipWidget",
    "button/UserStatus",
    "clipboard",
    "control/Task",
    "data/edition/Template",
    "data/edition/template/Text",
    "data/editor/AbstractEditor",
    "data/editor/AbstractTemplated",
    "data/editor/PgViewColumns",
    "data/editor/PhotoDetail",
    "data/editor/Property",
    "data/editor/PropertyEmbedMany",
    "data/editor/PropertyMixin",
    "data/editor/pgViewColumns/Column",
    "data/list/PgLinkData",
    "data/list/PgLinkTable",
    "data/list/PgLinkView",
    "data/list/Template",
    "data/list/header/PgLinkData",
    "data/list/header/PgLinkTable",
    "data/list/header/PgLinkView",
    "data/list/header/Template",
    "data/list/header/generic/ProgFilterField",
    "data/list/header/generic/Validity",
    "data/list/header/pgLinkData/Actions",
    "data/list/header/pgLinkTable/Actions",
    "data/list/header/pgLinkView/Actions",
    "data/list/header/template/Actions",
    "data/list/row/PgLinkData",
    "data/list/row/PgLinkTable",
    "data/list/row/PgLinkView",
    "data/list/row/Template",
    "data/pane/AbstractDataPane",
    "data/pane/Circle",
    "data/pane/general/ChooseDiscriminator",
    "data/pane/resource/ActionCreate",
    "data/pane/resource/BasicResource",
    "data/pane/resource/File",
    "data/pane/resource/file/Upload",
    "data/tool/LocaleSwitch",
    "data/tool/generic/DocValidity",
    "data/tool/generic/PropValidity",
    "input/AbstractListRow",
    "input/BooleanCheckBox",
    "input/BooleanToggleButton",
    "input/Choice",
    "input/Color",
    "input/ColorList",
    "input/ColorListInline",
    "input/DateTextBox",
    "input/DateTime",
    "input/Form",
    "input/Group",
    "input/Label",
    "input/List",
    "input/ListString",
    "input/MixedList",
    "input/TextBox",
    "input/_Forward",
    "input/file/Directory",
    "input/file/File",
    "input/file/Media",
    "input/file/Upload",
    "io/zig",
    "layout/AnchorButton",
    "layout/BlockManager",
    "layout/BorderContainer",
    "layout/Pane",
    "layout/RootPane",
    "layout/StackContainer",
    "layout/TabContainer",
    "layout/_Anchor",
    "layout/_StateContainer",
    "layout/anchor/Border",
    "layout/anchor/Corner",
    "layout/block/AbstractColumns",
    "layout/block/PureText",
    "layout/block/SimplePhotos",
    "layout/block/TextPhotoMix",
    "list/Abstract",
    "list/File",
    "list/edition/Abstract",
    "list/edition/AutoProperties",
    "list/edition/CommonProperties",
    "list/edition/_AutoPropertiesEmbed",
    "list/edition/tool/ApplyProperty",
    "list/header/Abstract",
    "list/header/File",
    "list/header/action/CreateModuleButtons",
    "list/header/file/Actions",
    "list/header/generic/AbstractEnumType",
    "list/header/generic/AbstractField",
    "list/header/generic/AbstractFilteredSortable",
    "list/header/generic/AbstractSortable",
    "list/header/generic/Actions",
    "list/header/generic/BooleanField",
    "list/header/generic/FilterOperators",
    "list/header/generic/Module",
    "list/header/generic/Name",
    "list/header/generic/NumberField",
    "list/header/generic/SelectEntityFilter",
    "list/header/generic/SelectFilter",
    "list/header/generic/Selection",
    "list/header/generic/StringField",
    "list/header/generic/Uuid",
    "list/record/Abstract",
    "list/record/File",
    "list/record/generic/EditAction",
    "list/tool/Pager",
    "locale",
    "macro/Editor",
    "macro/List",
    "macro/Player",
    "macro/Runner",
    "macro/action/Editor",
    "macro/action/MacroEditor",
    "macro/action/MacroRunner",
    "macro/action/Runner",
    "macro/action/ScriptEditor",
    "macro/action/ScriptRunner",
    "macro/action/TextEditor",
    "macro/action/TextRunner",
    "macro/action/TextRunnerHandler",
    "macro/action/TimeEditor",
    "macro/action/TimeRunner",
    "macro/editor/ActionList",
    "macro/package",
    "test/Api",
    "test/DomTest",
    "test/Example",
    "test/Runner",
    "test/Test",
    "test/data/Crud",
    "test/data/PgView",
    "tool/Library",
    "tool/dev/ExceptionDump",
    "tool/swfobject",
    "user/ChangePassword",
    "user/Confirmed",
    "user/Feedback",
    "user/Login",
    "user/RecoverPassword",
    "user/Registration",
    "user/ResetPassword",
    "util/openGraphProtocol",
    "widget/ButtonContainerMixin",
    "widget/Error",
    "widget/HtmlContent",
    "widget/I18nMixin",
    "widget/Options",
    "widget/Toaster",
    "widget/_AsyncInit",
    "widget/_AutoGrid",
    "widget/_AutoState",
    "widget/_LayoutSwitch",
  ];

  var excludesRe = new RegExp(("^geonef/jig/(" + excludes.join("|") + ")").replace(/\//, "\\/"));

  var usesDojoProvideEtAl = function(mid){
    return excludesRe.test(mid);
  };


  return {
    resourceTags:{
      test: function(filename, mid){
        return false; // no test yet
	// return testResourceRe.test(mid) || mid=="dijit/robot" || mid=="dijit/robotx";
      },

      copyOnly: function(filename, mid){
	return copyOnly(filename, mid);
      },

      amd: function(filename, mid){
	return !testResourceRe.test(mid) && !copyOnly(filename, mid) && !usesDojoProvideEtAl(mid) && /\.js$/.test(filename);
      },

      miniExclude: function(filename, mid){
        return false;
      	// return /^dijit\/bench\//.test(mid) || /^dijit\/themes\/themeTest/.test(mid);
      }
    },

    trees:[
      [".", ".", /(\/\.)|(~$)/]
    ]
  };

/**

    "start",
    "start/abstractWorkspace",
    "start/loadWorkspace",


*/
})();



