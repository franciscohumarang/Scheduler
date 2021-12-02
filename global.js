var timelineViews = ["timelineDay", "timelineWeek", "timelineWorkWeek", "timelineMonth",]
 var basicViews = ["day", "week", "workWeek", "month"];
var defaultView = "day";
var _scheduler;
var selectedViewType = basicViews;
var _startDate = "";
var _endDate = ""
var baseUrl = window.location.href;
var JobOrderNameForStep;
var StepId;;
var selectedJobForStep = [];

var url = window.location.href + "/api/JobData";
url = url.replace('//api', "/api");

var urlWithAction = window.location.href + "/api/SchedulerData";
urlWithAction = urlWithAction.replace('//api', "/api");


var fromMonth = false;


var action = "/GetJobs";
var updateAction = "/UpdateJob";
var insertAction = "/InsertJob";
var resourcesUrl = window.location.href + "/api/SchedulerResource";

resourcesUrl = resourcesUrl.replace('//api', "/api");

var masterData;

var _scheduleButton;
var selectedJobOrderNumber = "";
var draggingGroupName = "appointmentsGroup";
var statusResources = [];
var machineResources = [];
var jobOrderNumbers = [];
var personnelResources = [];
var jobResourceDataSources = [];

var listView;

var machineResourcesDefault = [];
var personnelResourcesDefault = [];
var jobResourceDataSourcesDefault = [];
var groups = [];
var selectedGroup="";
var searchedSteps = [];
var searchedJobs = [];
var btnText = "Schedule Job";
var btnState = false;
var subject = "JobOrderNumber";
var searchValue = "";
 
var currentSteps = [];
var isDblClicked = false;
var isDouble = 0;
var prevCellData = null;

var JobStartDateTimePrevious;
var JobStartDateTimeNew;

var JobStartDateChanged = false;
var JobEndDateChanged = false;

var JobEndDateTimePrevious;
var JobEndDateTimeNew;

var StepStartDateTimePrevious;
var StepStartDateTimeNew;

var StepEndDateTimePrevious;
var StepEndDateTimeNew;

var StepStartDateChanged = false;
var StepEndDateChanged = false;

var previousSelectedJobSteps = []

var JobRuntimeInMinutes;


var machineValues = [];
var personnelValues = [];

var previousSelectedMachines;
var previousSelectedPersonnel;

var previousSelectedJobMacines;
var previousSelectedJobPersonnel;

var newSelectedMachines;
var newSelectedPersonnel;

var newSelectedJobMacines;
var newSelectedJobPersonnel;


var isJobModalShown;
var unscheduledJobs = [];
var unscheduledSteps = [];
var returnedGuid = "";
var PersonnelPreviousValues;
var PersonnelNewValues;
var MachinePreviousValues;
var MachineNewValues;
var MachinePreviousValuesArr = [];
var MachineNewValuesArr = [];
var PersonnelPreviousValuesArr = [];
var PersonnelNewValuesArr = [];
var hasChanged = false;
var resourceCount = 0;
var isScheduleStep = false;
var fromResource = "";
var fromCurrent = "";
var isJobAllocateDeallocate = false;

var JobStepsParam = [];
var PassRequirement;

var userSetting = {}
var frozenZoneSetting = {}
 

var isRunTimeLocked = true;
var isCondensed = false;
var frozenZoneOffSetInMinutes = 0;
var selectedResources = [];
var selectedResourceName = "";
var selectedFilter = "";

var machinesSelectedResources = [];
var machineCondensedSelectedResources = [];
var personnelSelectedResources= [];
var jobsSelectedResources = [];

var btnBundlingState = false;

var GroupBundling  = [];
var BundlingCandidates = [];
var selectedBundlingCandidates = [];
var selectedBundlingId = [];
var totalBundlingRuntime = 0;
var selectedBundleInfo = {};
var isAdd = false;
var scheduleToggleMode = 'FWD';
var itemTypes = [];
var selectedItemType = "";


const actions = [
    { id: 1, text: NO_GROUPING },
    { id: 2, text: MACHINES },
    { id: 4, text: PERSONNEL },
    { id: 5, text: JOBS }
];
 

 


var selectedMode=2;
const schedulingModes = [
    { Id: 2, text: SCHEDULE_STEPS_INDEPENDENTLY },
    { Id: 0, text: SCHEDULE_STEPS_TOGETHER },
    { Id: 1, text: OVERRIDE_WORKFLOW_RULES }
];
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};

var _height = screen.height;
var winHeight;
if (_height >= 1504) {
    winHeight = "90vh";
    $(".jobstep-list-content").css("height", "calc(90vh - 140px)");
}
else if (_height <= 1080) {
    winHeight = "83vh"
    $(".jobstep-list-content").css("height", "calc(83vh - 140px)");
} else {
    
        winHeight = "87vh";
        $(".jobstep-list-content").css("height", "calc(87vh - 140px)");
    
}

if (typeof _height == "undefined") {
    winHeight = "90vh";
    $(".jobstep-list-content").css("height", "calc(90vh - 140px)");
}

$(".panel-container").css("height", winHeight);


DevExpress.viz.currentTheme("generic.light");

var getDataSource = DevExpress.data.AspNet.createStore({
    key: subject,
    loadUrl: url + "?startDate=" + _startDate + "&endDate=" + _endDate + "&search=" + searchValue,
    insertUrl: url + "?Mode=" + scheduleToggleMode,
    updateUrl: url,

    onBeforeSend: function (method, ajaxOptions) {
        ajaxOptions.xhrFields = { withCredentials: true };
    },
    onInserted: function (values, key) {
         
        returnedGuid = values;
  

    },

    onUpdated: function (key, values) {
        // Your code goes here
        
        returnedGuid = values;
 

    }, errorHandler: function (error) {
        loadPanel.hide();
        toasterAlert("error", SERVER_ERROR);
        console.log(error.message);
    }
});


var __text;

var loadPanel = $(".loadpanel").dxLoadPanel({
    
    position: { my: "center", at: "center", of: "#scheduler" },
    visible: false,
    showIndicator: true,
    showPane:true,
    shading: true,
    message: UPDATING + "..."
}).dxLoadPanel("instance");

$("#btn-edit-job-ok").click(function () {

 


    let validationGroup = DevExpress.validationEngine.getGroupConfig("ScheduleJobDates");

   let result = validationGroup.validate();

    if (result.isValid) {

        hasChanged = false;
        let param = {};
        let updated = false

        loadPanel.show(); 

        

        let startDate = $("#dx-StartDate").dxDateBox("instance");
        let endDate = $("#dx-EndDate").dxDateBox("instance");


        let jobStartDateTimeNew = new Date(startDate.option("value")).toISOString();
        let jobEndDateTimeNew = new Date(endDate.option("value")).toISOString();
        param.JobOrderNumber = selectedJobOrderNumber;
        param.StartDateTime = jobStartDateTimeNew;
        param.EndDateTime = jobEndDateTimeNew;
        param.IsScheduleForward = true
        param.Steps = JobStepsParam;
        param.SelectedMode = selectedMode;
        param.ScheduleMode =  scheduleToggleMode;

        $.ajax({
            url: urlWithAction + "/ScheduleJob",
            method: "POST",
            data: param
        }).always(function (result) {
            $("#EditJobModal").modal('hide');
          

            returnedGuid = result;

            JobStepsParam = [];
            selectedJobOrderNumber = "";

            GetJobDataSource();

            //  $("#scheduler").dxScheduler("getDataSource").reload();
        });

    } else
        toasterAlert("error", REQUIRED_INPUT_DATA)
        
 


});

$("#btn-edit-step-ok").click(function () {


    let validationGroup = DevExpress.validationEngine.getGroupConfig("ScheduleStepDates");

    let result = validationGroup.validate();

    if (result.isValid) {


        if (Number.isNaN(JobRuntimeInMinutes)) {

            toasterAlert("error", INVALID_DATA)

            return;
        }


        hasChanged = false;

        let dxPersonnel = $('#dx-Personnel1').dxTagBox('instance');
        let dxMachine = $('#dx-Machine1').dxTagBox('instance');


        let startDate = $("#dx-StepStartDate").dxDateBox("instance");
        let endDate = $("#dx-StepEndDate").dxDateBox("instance");

        let mappedData = {};
        let updated = false
        mappedData.JobOrderNumber = JobOrderNameForStep;
        mappedData.StepName = $("#StepNameModal").text();


        mappedData.StartDateTime = new Date(startDate.option("value")).toISOString();;
        mappedData.EndDateTime = new Date(endDate.option("value")).toISOString();;;
        mappedData.SelectedMode = selectedMode;
        mappedData.PassRequirement = PassRequirement;
        mappedData.NewPersonnel = [];
        mappedData.NewMachines = [];
        mappedData.ScheduleMode = scheduleToggleMode;


        mappedData.RuntimeInMinutes = JobRuntimeInMinutes;
        mappedData.NewPersonnel = dxPersonnel.option("value");
        mappedData.NewMachines = dxMachine.option("value");

        isScheduleStep = false;


        let duration = getMinutesBetweenDates(mappedData.StartDateTime, mappedData.EndDateTime);



        if (duration < 0) {

            toasterAlert("error", DURATION_ERROR)
            return;
        }

        loadPanel.show();




        $.ajax({
            url: urlWithAction + "/RescheduleStep",
            method: "POST",
            data: mappedData
        }).always(function (msg) {
            returnedGuid = msg;
       
            $("#EditStepModal").modal('hide');


            _scheduler.option("dataSource", getDataSource);

            $("#scheduler").dxScheduler("getDataSource").reload().then(() => {
                loadPanel.hide();
            });


              

        }).fail(function (msg) {


            toasterAlert("error", SERVER_ERROR);

            console.log("Error: " + JSON.stringify(msg.responseText))
            $("#EditStepModal").modal('hide');

        });

        StepStartDateChanged = false;
        notUpdated = false;

        hasChanged = true;




    } else
        toasterAlert("error", REQUIRED_INPUT_DATA)
 
 

});


$("#btn-edit-job-steps-ok").click(function () {
    hasChanged = false;

    JobStepsParam = [];

    currentSteps.forEach(function (step) {

 


        let jobStep = {};
        jobStep.StepName = step.StepName;
        jobStep.RuntimeInMinutes = step.RuntimeInMinutes;

        let dxPersonalInstance = $("#dx-Personnel" + step.Id).dxTagBox('instance');

        let dxMachineInstance = $("#dx-Machine" + step.Id).dxTagBox('instance');

        let flag = 0;

        if (typeof dxPersonalInstance != "undefined") {

            jobStep.NewPersonnel = dxPersonalInstance.option("value");          
            flag = 1;          
        }

        if (typeof dxMachineInstance != "undefined") {
            jobStep.NewMachines = dxMachineInstance.option("value");
            flag = 1;
        }

        if (flag==1)
            JobStepsParam.push(jobStep);
 
        
    });

 
 


 

   
    $("#EditStepsModal").modal('hide');

});


function dateAdd(date, interval, units) {

    if (!(date instanceof Date))
        return undefined;

    let ret = new Date(date); //don't change original date
    let checkRollover = function () { if (ret.getDate() != date.getDate()) ret.setDate(0); };

    switch (String(interval).toLowerCase()) {

        case 'year': ret.setFullYear(ret.getFullYear() + units); checkRollover(); break;
        case 'quarter': ret.setMonth(ret.getMonth() + 3 * units); checkRollover(); break;
        case 'month': ret.setMonth(ret.getMonth() + units); checkRollover(); break;
        case 'week': ret.setDate(ret.getDate() + 7 * units); break;
        case 'day': ret.setDate(ret.getDate() + units); break;
        case 'hour': ret.setTime(ret.getTime() + units * 3600000); break;
        case 'minute': ret.setTime(ret.getTime() + units * 60000); break;
        case 'second': ret.setTime(ret.getTime() + units * 1000); break;
        default: ret = undefined; break;
         
    }

    return ret;
}

function getDDHHM(time) {
    return pad(Math.floor(time / 24 / 60),3) + "" + pad(Math.floor((time / 60) % 24),2) + '' + pad(Math.floor(time % 60),2);
 
}
function pad(str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
}

function getMinutesBetweenDates(startDate, endDate) {
    var diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return (diff / 60000);
}
function formatDate(dateString) {
 
    var thisDate = dateString.split('-');
   
    var newDate = [thisDate[2], thisDate[1], thisDate[0]].join("/");

 

    return newDate;
}

function getHoursAndMinutes(n) {
    let num = n;
    let hours = (num / 60);
    let rhours = Math.floor(hours);
    let minutes = (hours - rhours) * 60;
    let rminutes = Math.round(minutes);
   

    return `${rhours}`.padStart(2, '0') + "" + `${rminutes}`.padStart(2, '0')
}

function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? PM : AM;
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function showToast(event, value, type) {
    DevExpress.ui.notify(event + " \"" + value + "\"" + " task", type, 800);
}

function showPanel() {
    let x = document.getElementById("side-panel");
    if (x.style.display === "none") {
        x.style.display = "block";

        setTimeout(() => {
            x.style.opacity = 1;
        }, 300);
    } else {
        x.style.opacity = 0;

        setTimeout(() => {
            x.style.display = "none";
        }, 300);
    }
}

function getSearchedUnscheduledJobs(value) {
    $.getJSON(resourcesUrl + "/GetUnscheduleJobSummaries?search=" + value, function (data) {

        unscheduledJobs = [];
        unscheduledJobs = data;

      

        $(".job-list").empty();
        unscheduledJobs.forEach(function (job) {
            createJobList(job);
        });

    });
}

function getSearchedUnscheduledSteps(value) {
    $.getJSON(resourcesUrl + "/GetUnscheduleJobSteps?search=" + value, function (data) {

        unscheduledSteps = [];
        unscheduledSteps = data;

        

        $(".job-list").empty();

        unscheduledSteps.forEach(function (step) {


         createStepList(step)
       

        });

    });
}

var groupBundleGrid;
var editLoaded = false;
var selectedCount = 0;
var loadedCount = 0;
var isUnscheduled = false;

function PopulateStepList(newValues) {
    $(".job-list").empty()

    if (newValues.length > 0) {

        for (var i = 0; i < newValues.length; i++) {
            let job = newValues[i]

            unscheduledSteps.forEach(function (js) {

                if (js.JobOrderNumber == job) {

                    let steps = [];
                    steps = js.JobSteps;

                   

                    if (steps && steps.length > 0) {

                        steps.forEach(function (step) {

                            createStepList(step)
                        })
                    }


                }
            })

        }
    }
}

function PopulateBundlingGroup() {
    $(".bundling-list").empty();
    GroupBundling.forEach(function (group) {
        createBundlingList(group);
    });
}

function SearchGroupBundle(data) {

    $(".bundling-list").empty();
    let filtered = [];
 

    GroupBundling.forEach(function (group) {

        if (group.Name.indexOf(data) >= 0) {
            filtered.push(group);
        }
    });
   
    if (filtered != "undefined") {
        filtered.forEach(function (group) {
            createBundlingList(group);
        });
    }
}
function arrayRemove(arr, value) {

    return arr.filter(function (ele) {
        return ele != value;
    });
}

var toasterAlert = function (cls, msg) {
    toastr[cls](msg);

    toastr.options = {
        "showDuration": 2000
    }
}


var toasterAlert = function (cls, msg) {
    toastr[cls](msg);
}


function GetDataSource() {

    if (subject == "JobOrderNumber") {

        action = "/GetJobs";

        updateAction = "/UpdateJob";
        insertAction = "/InsertJob";

        url = window.location.href + "/api/JobData" + "&Mode=" + scheduleToggleMode;;
        url = url.replace('//api', "/api");
    } else {

        action = "/GetSteps";
        updateAction = "/UpdateStep";
        insertAction = "/InsertStep";


        url = window.location.href + "/api/StepData?selectedMode=" + selectedMode + "&selectedResource=" + selectedGroup + "&fromResource=" + fromResource + "&Mode=" + scheduleToggleMode;
        url = url.replace('//api', "/api");
    }
 
 

    getDataSource = DevExpress.data.AspNet.createStore({
        key: subject,
        loadUrl: url + "?startDate=" + _startDate + "&endDate=" + _endDate + "&search=" + searchValue,
        insertUrl: url,
        updateUrl: url,

        onBeforeSend: function (method, ajaxOptions) {
            ajaxOptions.xhrFields = { withCredentials: true };
        },
        onInserted: function (values, key) {
          
            returnedGuid = values;

        },

        onUpdated: function (key, values) {


            returnedGuid = values;

        },
        errorHandler: function (error) {
            loadPanel.hide();
            toasterAlert("error", SERVER_ERROR);
            console.log(error.message);
        }
    })

    _scheduler.option("dataSource", getDataSource);
    $("#scheduler").dxScheduler("getDataSource").reload().then(() => {
        loadPanel.hide();
    });

}

function GetJobDataSource() {

 

        action = "/GetJobs";

        updateAction = "/UpdateJob";
        insertAction = "/InsertJob";

        url = window.location.href + "/api/JobData";
        url = url.replace('//api', "/api");
 

 
 

    getDataSource = DevExpress.data.AspNet.createStore({
        key: subject,
        loadUrl: url + "?startDate=" + _startDate + "&endDate=" + _endDate + "&search=" + searchValue,
        insertUrl: url,
        updateUrl: url,

        onBeforeSend: function (method, ajaxOptions) {
            ajaxOptions.xhrFields = { withCredentials: true };
        },
        onInserted: function (values, key) {
            
            returnedGuid = values;

        },

        onUpdated: function (key, values) {


            returnedGuid = values;

        }
    })

    _scheduler.option("dataSource", getDataSource);
    $("#scheduler").dxScheduler("getDataSource").reload().then(() => {
        loadPanel.hide();
    });

}

function loadjscssfile(filename, filetype) {
    if (filetype == "js") { //if filename is a external JavaScript file
        var fileref = document.createElement('script')
        fileref.setAttribute("type", "text/javascript")
        fileref.setAttribute("src", filename)
    }
    else if (filetype == "css") { //if filename is an external CSS file
        var fileref = document.createElement("link")
        fileref.setAttribute("rel", "stylesheet")
        fileref.setAttribute("type", "text/css")
        fileref.setAttribute("href", filename)
    }
    if (typeof fileref != "undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}

function LoadCSS( cssURL ) {

    // 'cssURL' is the stylesheet's URL, i.e. /css/styles.css

    return new Promise( function( resolve, reject ) {
        var link = document.createElement( 'link' );
        link.rel  = 'stylesheet';
        link.href = cssURL;
        document.head.appendChild( link );
        link.onload = function() { 
            resolve(); 
          
        };
    } );
}

function sortByKey(array, key) {
    return array.sort((a, b) => {
        let x = a[key];
        let y = b[key];

        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

var runtimeValues = []

 

function updateResourceSettings(userId) {


   let   selectedResourceRequest = {}
   
    selectedResourceRequest.UserId = userId;
    let resourceSelections = []
    let resource= {};

    resource.SelectedResource = "Machines";
    resource.SelectedValues = machinesSelectedResources
    resourceSelections.push(resource);
    resource = {};

    resource.SelectedResource = "Personnel";
    resource.SelectedValues = personnelSelectedResources
    resourceSelections.push(resource);
    resource = {};
    resource.SelectedResource = "Jobs";
    resource.SelectedValues = jobsSelectedResources
    resourceSelections.push(resource);

    selectedResourceRequest.ResourceSelections = resourceSelections

  
     
    $.ajax({
        url: urlWithAction + "/UpdateResourceSelections",
        method: "POST",
        data: selectedResourceRequest
    }).always(function () {
     


    }).fail(function (msg) {

       
        console.log("SUBMIT UPDATE RESOURCE  ERROR: " + JSON.stringify(msg))

        
    })
}