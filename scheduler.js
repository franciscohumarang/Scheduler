
function Initialize() {

    $("#side-panel").hide();
    $("#side-panel-bundling").hide();

    _scheduler = $("#scheduler").dxScheduler({
        dataSource: getDataSource,

        remoteFiltering: true,
        showCurrentTimeIndicator: false,
        editing: {
            allowAdding: true,

            allowUpdating: true,
            allowResizing: false,
            allowDragging: true
        },

        resources: [

            {

                dataSource: statusResources,
                fieldExpr: "ProductionStatus",
                allowMultiple: false,
                useDefaultColor: true,

                label: "Status",
                colorExpr: "Color",
                valueExpr: "ProductionStatus",
                displayExpr: "ProductionStatus"
            },
            {

                dataSource: machineResources,
                fieldExpr: "MachineName",
                allowMultiple: true,
                label: "Alloted Machines",
                valueExpr: "MachineName",
                displayExpr: "MachineName"
            },
            {

                dataSource: personnelResources,
                fieldExpr: "PersonnelName",
                allowMultiple: true,
                label: "Alloted Personnels",
                valueExpr: "PersonnelName",
                displayExpr: "PersonnelName"
            },
            {
                dataSource: jobResourceDataSources,
                fieldExpr: "JobOrder",
                allowMultiple: true,
                label: "Job Order Name",
                valueExpr: "JobOrder",
                displayExpr: "JobOrder"
            }
        ],

        views: selectedViewType,
        currentView: defaultView,
        currentDate: new Date(),
        crossScrollingEnabled: true,
        showAllDayPanel: true,
        groups: groups,
        height: winHeight,
        textExpr: subject,
        startDateExpr: "ScheduledStartDateTime",
        endDateExpr: "ScheduledEndDateTime",
        onContentReady: function (e) {

            $("#stepsStartDate").val(e.component.getStartViewDate().toLocaleDateString());
            $("#stepsEndDate").val(e.component.getEndViewDate().toLocaleDateString());

            _startDate = e.component.getStartViewDate().toLocaleDateString();


            $("#jobsStartDate").val(_startDate);
            _endDate = e.component.getEndViewDate().toLocaleDateString();

            var resources = _scheduler.option("resources");

            for (var i = 0; i < resources.length; i++) {
                resources[i].useColorAsDefault = resources[i].label == "Status";
            }

            var rowHeight = e.element.find(".dx-scheduler-group-row").height();
         

        },

        appointmentDragging: {
            group: draggingGroupName,
            onRemove: function (e) {
                e.component.deleteAppointment(e.itemData);

            },
            onAdd: function (e) {

                e.component.addAppointment(e.itemData);

                /*e.itemElement.remove();*/

                draggableElement = e.itemData;

                loadPanel.show();


            },
            onDragStart: function (e) {

                if (subject == "StepName") {
                    const { component, itemData, itemElement } = e;


                    const targetedAppointment = component.getTargetedAppointment(itemData, itemElement);
                    let resourceValue = "";


                    if (selectedGroup == PERSONNEL) {

                        fromResource = targetedAppointment.PersonnelName;

                    }

                    if (selectedGroup == MACHINES) {

                        fromResource = targetedAppointment.MachineName;

                    }
                }






            }


        },
        onCellClick: function (e) {
            e.cancel = true;
        },
        appointmentTooltipTemplate: function (model) {


            if (subject == "StepName") {


                var machines = "";
                var personnel = "";

                $.each(model.appointmentData.AllocatedMachines, function (i, item) {
                    machines += item.Name + ", ";

                });

                $.each(model.appointmentData.AllocatedPersonnels, function (i, item) {

                    personnel += item.Name + ", "; 
                });
 
                return $("<div style='text-align:left;margin-left:10px'>" +
                    "<div style='font-size:13px;font-weight:bold'>" + model.appointmentData.JobOrderNumber + "</div>" +
                    "<div>" + model.appointmentData.StepName + "</div>" +

                    "<div>" + new Date(model.appointmentData.ScheduledStartDateTime).toLocaleString(LOCALE_TIME, { hour: 'numeric', minute: 'numeric', hour12: false }).replace('24:', '00:') +
                        " - " + new Date(model.appointmentData.ScheduledEndDateTime).toLocaleString(LOCALE_TIME, { hour: 'numeric', minute: 'numeric', hour12: false }).replace('24:', '00:') +
                    "</div>" +
                    "<div>" + REASON_EDITOR_PERSONNEL_LABEL +":" + personnel.slice(0, -2) + "</div>" +
                    "<div>" + REASON_EDITOR_ASSETS_LABEL + ": " + machines.slice(0, -2) + "</div>" +
                    "</div>");
            } else {

                return $("<div style='text-align:left;margin-left:10px'>" +
                    "<div style='font-size:14px;font-weight:bold'>" + model.appointmentData.JobOrderNumber + "</div>" +

                    "<div>" + new Date(model.appointmentData.ScheduledStartDateTime).toLocaleString(LOCALE_TIME, { hour: 'numeric', minute: 'numeric', hour12: false }).replace('24:', '00:') +
                        " - " + new Date(model.appointmentData.ScheduledEndDateTime).toLocaleString(LOCALE_TIME, { hour: 'numeric', minute: 'numeric', hour12: false }).replace('24:', '00:') +
                    "</div>" +

                    "</div>");
            }
        },

        onAppointmentRendered: function (itemData) {
            if (subject == "StepName") {


                if (itemData.appointmentData.ProductionStatus == "StepOver") {
                    let view = _scheduler.option("currentView");
                    let element = itemData.appointmentElement;

                    if (view.indexOf("timeline") >= 0 && view != "timelineMonth") {

                        element.addClass("adjustStepOverLeftMargin");
                    } else {


                        element.hide();
                    }

                }
            }

        },
        
        appointmentTemplate: function (model, itemElement) {

            let startDate = new Date(model.appointmentData.ScheduledEndDateTime)
            let endDate = new Date(model.appointmentData.ScheduledStartDateTime)
            let diff = Math.abs(endDate - startDate) / 1000 / 3600
            if (subject == "StepName") {
                var machines = "";
                var personnel = "";
                let stepname = model.appointmentData.StepName;


                let view = _scheduler.option("currentView");

                if (model.appointmentData.ProductionStatus == "StepOver") {

                    if (view.indexOf("timeline") >= 0) {
                        var element = $("<div>" + stepname + "</div>");

                        return element;
                    } else
                        return;

                }


                $.each(model.appointmentData.AllocatedMachines, function (i, item) {

                    machines += item.Name + "<br>";

                });

                $.each(model.appointmentData.AllocatedPersonnels, function (i, item) {

                    personnel += item.Name + "<br>";
                });

                if (diff >= 24) {
                    return $("<div class='showtime-preview'>" +
                        "<div style='font-size:13px;'>" + model.appointmentData.JobOrderNumber + "</div>" +

                        "</div>");
                } else {
                 

                    if (typeof stepname === "undefined")
                        stepname = "";

                    return $("<div class='showtime-preview'>" +
                        "<div style='font-size:13px;'>" + model.appointmentData.JobOrderNumber + "</div>" +
                        "<div>" + stepname + "</div>" +

                        "<div>" + new Date(model.appointmentData.ScheduledStartDateTime).toLocaleString(LOCALE_TIME , { hour: 'numeric', minute: 'numeric', hour12: false }).replace('24:', '00:') +
                        " - " + new Date(model.appointmentData.ScheduledEndDateTime).toLocaleString(LOCALE_TIME , { hour: 'numeric', minute: 'numeric', hour12: false }).replace('24', '00:') +
                        "</div>" +
                        "<div> " + personnel.slice(0, -4) + "</div>" +
                        "<div> " + machines.slice(0, -4) + "</div>" +
                        "</div>");
                }



            } else {
                if (diff >= 24) {
                    return $("<div class='showtime-preview'>" +
                        "<div style='font-size:13px;'>" + model.appointmentData.JobOrderNumber + "</div>" +

                        "</div>");
                } else {

                    return $("<div class='showtime-preview'>" +
                        "<div style='font-size:13px;'>" + model.appointmentData.JobOrderNumber + "</div>" +

                        "<div>" + new Date(model.appointmentData.ScheduledStartDateTime).toLocaleString(LOCALE_TIME , { hour: 'numeric', minute: 'numeric', hour12: false }).replace('24:', '00:') +
                        " - " + new Date(model.appointmentData.ScheduledEndDateTime).toLocaleString(LOCALE_TIME , { hour: 'numeric', minute: 'numeric', hour12: false }).replace('24:', '00:') +
                        "</div>" +

                        "</div>");
                }
            }
        },

        onAppointmentFormOpening: function (data) {



            data.cancel = true;


            JobRuntimeInMinutes = 0;


            let appointment = data.appointmentData;

          
                SchedulerPopup(appointment);
      

        },

        onAppointmentUpdating: function (e) {
            
            let view = _scheduler.option("currentView");

            
            isUnscheduled = false;

                let currentData = e.newData;



                if (subject == "StepName" && selectedGroup != "") {

                    if (selectedGroup == PERSONNEL)
                    {
                       
                        currentData.AllocatedPersonnels = currentData.AllocatedPersonnels.filter(function (el) { return el.Name != fromResource ; });  
                        let newData = currentData.PersonnelName.toString()
                        let pushData = { "Name": newData };
                        currentData.AllocatedPersonnels.push(pushData)

                    }

                    if (selectedGroup == MACHINES)
                    {
                    
                        currentData.AllocatedMachines = currentData.AllocatedMachines.filter(function (el) { return el.Name != fromResource; }); 
                        let newData = currentData.MachineName.toString()
                        let pushData = { "Name": newData };
                        currentData.AllocatedMachines.push(pushData);
                    }

                   
                } 

               
            
         
            let newRuntimeInMinutes = getMinutesBetweenDates(currentData.ScheduledStartDateTime, currentData.ScheduledEndDateTime);

         

            let checkBox = $("#dx-checkBox").dxCheckBox("instance");
            if (currentData.RuntimeInMinutes != newRuntimeInMinutes) {

                isRunTimeLocked = false;

                checkBox.option("value", false);
            } else {
                checkBox.option("value", true);
                isRunTimeLocked = true;
            }


             
                SchedulerPopup(currentData);
             
       
        },
        onAppointmentUpdated: function (e) {


            if (e.error) {
                toasterAlert("error", SERVER_ERROR);

            } else
                fromCurrent = "YES";

            loadPanel.hide();
        },

        onAppointmentAdded: function (e) {
            if (e.error) {
                toasterAlert("error", SERVER_ERROR);

            } else
                fromCurrent = "YES";

            loadPanel.hide();
        },
    

  
  


    }).dxScheduler('instance');;





}

function isFrozenZone(date) {

    if (jQuery.isEmptyObject(frozenZoneSetting) == false) {

         

            let compareDate = new Date(date) 
            let startDate = new Date(frozenZoneSetting.FromTime) 
            let endDate = new Date(frozenZoneSetting.ToTime) 

            if (compareDate <= endDate && compareDate >= startDate) {
                return true;
            } else
                return false;
      
    } else
        return false;
  
}

function reloadDataSource() {

    if (subject == "JobOrderNumber") {
        url = window.location.href + "/api/JobData";
        url = url.replace('//api', "/api");

    }else {
        url = window.location.href + "/api/StepData?selectedMode=" + selectedMode + "&selectedResource=" + selectedGroup + "&fromResource=" + fromResource;
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
          //  $("#scheduler").dxScheduler("getDataSource").reload();
        },

        onUpdated: function (key, values) {
            // Your code goes here
         
            returnedGuid = values;
           // $("#scheduler").dxScheduler("getDataSource").reload();
        },
        errorHandler: function (error) {
            loadPanel.hide();
            toasterAlert("error", SERVER_ERROR);
            console.log(error.message);
        }
    });

    _scheduler.option("dataSource", getDataSource);
}

function SchedulerPopup(data) {
 


    JobRuntimeInMinutes = 0;

    if (subject == "JobOrderNumber") {


        $("#btn-unschedule-job").show();
        $("#stepsContainer").empty();
        $("#dx-SearchJobStep").dxTextBox("instance").option("value", "")

        $('#EditJobModal').modal('show');

        $("#btn-edit-step").show();
        //bind Job Model

        $("#JobNameModal").text(data.JobOrderNumber);

        selectedJobOrderNumber = data.JobOrderNumber;

        let startDate = $("#dx-StartDate").dxDateBox("instance");
        let endDate = $("#dx-EndDate").dxDateBox("instance");

        startDate.option("value", data.ScheduledStartDateTime);
        endDate.option("value", data.ScheduledEndDateTime);

        JobRuntimeInMinutes = data.ExpectedRunTimeInMinutes;

        currentSteps = data.Steps;




        $("#stepsContainer").empty();

        if (currentSteps != null) {
            if (currentSteps.length > 0) {

                currentSteps.forEach(function (step) {


                    //create step container

                    createEditStepList(step);

                });

                currentSteps.forEach(function (step) {
                    createPersonnelTagBoxes(step);
                    createMachineTagBoxes(step)
                });



            }
        }

    } else {
        $("#btn-unschedule-step").show();
        $('#EditStepModal').modal('show');
        JobRuntimeInMinutes = data.RuntimeInMinutes;
        $("#StepNameModal").text(data.StepName);
        JobOrderNameForStep = data.JobOrderNumber

        PassRequirement = 1;

        $('#dx-Personnel1').show();
        $('#dx-Machine1').show();

        $(".step-machine").show();
        $(".step-personnel").show();

        let startDate = $("#dx-StepStartDate").dxDateBox("instance");
        let endDate = $("#dx-StepEndDate").dxDateBox("instance");

        let dxPersonnel1 = $('#dx-Personnel1').dxTagBox('instance');

        let dxMachine1 = $('#dx-Machine1').dxTagBox('instance');

        let nullArray = [];

        dxPersonnel1.option("value", nullArray);
        dxMachine1.option("value", nullArray);

        startDate.option("value", data.ScheduledStartDateTime);
        endDate.option("value", data.ScheduledEndDateTime);

        StepStartDateTimeNew = data.ScheduledStartDateTime;

        StepId = data.Id



        StepStartDateChanged = false;
        StepEndDateChanged = false;

        machineValues = []
        $.each(data.AllocatedMachines, function (i, item) {

            machineValues.push(item.Name);
        });


        personnelValues = []
        $.each(data.AllocatedPersonnels, function (i, item) {

            personnelValues.push(item.Name);
        });


        dxPersonnel1.option("value", personnelValues);
        dxMachine1.option("value", machineValues);

        PersonnelPreviousValues = personnelValues;
        MachinePreviousValues = machineValues;

        let newRuntime = Math.abs(Math.round((new Date(data.ScheduledEndDateTime).getTime() - new Date(data.ScheduledStartDateTime).getTime())/1000/60));


        let ddhhmm = getDDHHM(newRuntime);




        let dxTxtInterval = $("#dx-txtDuration").dxTextBox("instance");      

        isRunTimeLocked = true;

        dxTxtInterval.option("value", ddhhmm);

        dxTxtInterval.option("disabled", true);
        let checkBox = $("#dx-checkBox").dxCheckBox("instance");
       
         checkBox.option("value", true);
 

    }

}

function createPersonnel(Id) {

    return ('<div id="dx-Personnel' + Id + '"></div>')

}

function createMachine(Id) {

    return ('<div id="dx-Machine' + Id + '"></div>')

}

function createPersonnelTagBoxes(step) {

    let values = [];
  let data=  step.AllocatedPersonnels 

 


    $.each(data, function (i, item) {
        
        values.push(item.Name);

    });
 

    $("#dx-Personnel" + step.Id).dxTagBox({

       
        dataSource: new DevExpress.data.ArrayStore({
            data: personnelResources,
            key: "PersonnelId"
        }),
        displayExpr: "PersonnelName",
        valueExpr: "PersonnelName",
        searchEnabled: true,
        value: values,
        onValueChanged: function (e) {

            if (!e.event)
                return false;

        }
    });
}

function createMachineTagBoxes(step) {

    let values = [];
    let data = step.AllocatedMachines

 


    $.each(data, function (i, item) {

        values.push(item.Name);
    });

   

    $("#dx-Machine" + step.Id).dxTagBox({
        dataSource: new DevExpress.data.ArrayStore({
            data: machineResources ,
            key: "MachineId"
        }),
        displayExpr: "MachineName",
        valueExpr: "MachineName",
        searchEnabled: true,
        value: values 
    });
}
 
var createEditStepList = function (data) {

 

 $("#stepsContainer").append('<div class="step-container"><div class="row step-align" id="stepRow' + data.Id + '"><div class="col-sm-6 step-name-align"><h6 id="Step' + data.Id + '">' + data.StepName + '</h6></div> <div class="row step-align"><div class="col-sm-6"><h7 style="font-size:13px">' + ASSIGNED_PERSONNEL + '</h7></div><div class="col-sm-12">' + createPersonnel(data.Id) + '</div> </div><div class="w-100 spacer"></div><div class="row step-align"><div class="col-sm-6"><h7 style="font-size:13px">' + ASSIGNED_MACHINES + '</h7></div><div class="col-sm-12">' + createMachine(data.Id) + '</div> </div><div class="w-100 spacer"></div><div class="w-100 spacer"></div></div>')

   
     
}

var createJobList = function (data) {

    $('<div id="job-panel-container" class="job-container"><div class="job-details"><p class="blue">' + data.JobOrderNumber + ' </p><p style="color:#565656"> ' + REQUESTED_DATE + ': ' + formatDate(new Date(data.RequestedEndDateTime).toISOString().split('T')[0]) + ' </p><a style="display:none;text-decoration:underline;color:#37467B;" href="http://182.77.61.134/ArcLite.V12.Workstation/Reports/SalesReport?salesId=' + data.Id + '" target="_blank">View Sales Order</a></div><button  value="' + data.JobOrderNumber + "`" + data.ExpectedRunTimeInMinutes + '"  class="job-button" onclick="scheduleJob($(this))" type="button">' + SCHEDULE + '</button></div></div>')
        .appendTo(".job-list")
        .dxDraggable({
        group: draggingGroupName,
        data: data,
        clone: true,
            onDragEnd: function (e) {
                e.itemElement.css("opacity", 1);
            if (e.toData) {
                e.cancel = true;
            }
        },

        onDragStart: function (e) {
            
            e.itemElement.css("opacity", 0.5);
            e.itemData = e.fromData;
        }
    });
        

}

 function buildBindlingJobDetail(data)
 {
     let text = ""
     data.forEach(function (item) {

         text += '<p style="color:#565656">' + item.JobOrderNumber + ' - ' + item.StepName + '</p > ';

     });

     return text;
}

var createBundlingList = function (data) {

    $('<div id="bundling-panel-container" class="bundle-container"><div class="job-details"> <p class="blue">' + data.Name + ' </p>' + buildBindlingJobDetail(data.BundleInfoItems) + '</div> <div style="float:right"> <button value="' + data.Name + "|" + data.BundledDuration + "|" + data.Id + '"onclick="EditGroupBundle($(this))" class="arc-btn-outline btn btn-md"  type="button"><i class="fas fa-pencil-alt"></i></button> <button value="' + data.Id + '" onclick="DeleteGroupBundle($(this));" type="button" class="arc-btn-outline btn btn-md" data-toggle="tooltip"><i class="fas fa-trash-alt"></i></button> </div> </div>')
        .appendTo(".bundling-list");
}

var createStepList = function (data) {

    $('<div id="step-container" class="job-container"><div class="job-details"><p class="blue">' + data.StepName + ' </p><p style="color: gray;font-size: 12px">' + convertMinsToHrsMins(data.RuntimeInMinutes) + '</p></div><button  value="' + data.StepName + "`" + data.JobOrderNumber + "`" + data.RuntimeInMinutes + '"   class="job-button" onclick="scheduleStep($(this))" type="button">' + SCHEDULE +'</button> </div></div> ')
        .appendTo(".job-list")
        .dxDraggable({
            group: draggingGroupName,
            data: data,
            clone: true,
            onDragEnd: function (e) {
                e.itemElement.css("opacity", 1);
                if (e.toData) {
                    e.cancel = true; 
                }
            },

            onDragStart: function (e) {

                e.itemElement.css("opacity", 0.5);
                e.itemData = e.fromData;
            }
        });

}



function scheduleJob(el) {

    let data = el.attr("value");

     getJobOrder(data);

    $("#btn-unschedule-job").hide();

}

function DeleteGroupBundle(el) {
 
    let data = el.attr("value");
    selectedBundlingId = data;

    $("#GroupBundleConfirmDeleteModal").modal('show');
}

function EditGroupBundle(el) {
    isAdd = false;
 
    RefreshBundlingCandidates();
    groupBundleGrid.refresh();

    groupBundleGrid.clearFilter();
    editGroupSelected = false;
    let data = el.attr("value");

    let chars = data.split("|");

    let job = chars[0];
    let runtime = chars[1];
    let id = chars[2];
    selectedBundleInfo = $.grep(GroupBundling, function (e) { return e.Id == id });


    selectedBundlingId = id;
  
    let selected = selectedBundleInfo[0].BundleInfoItems;
     
    let newSeleted = [];
    selectedCount = 0;
    loadedCount = 0;
    selected.forEach(function (item) {
        let a = {};

        a.JobOrderNumber = item.JobOrderNumber;
        a.StepName = item.StepName;
        a.RuntimeInMinutes = selectedBundleInfo[0].BundledDuration;
        newSeleted.push(a);
        selectedCount += 1;
    })
    
    let newArray = [...newSeleted, ...BundlingCandidates];

 

    $("#AddEditBundleGroupModal").modal('show');
    $("#dx-txt-bundle-job-name").dxTextBox("instance").option("value", job);

 
         $("#dx-txt-bundle-runtime").dxTextBox("instance").option("value", runtime);

    $("#dx-txt-bundle-runtime").dxTextBox("instance").option("disabled", true);
    $("#dx-bundling-grid").dxDataGrid("instance").deselectAll();
    groupBundleGrid.option("dataSource", newArray);
    
    editLoaded = true;
    $("#dx-bundling-grid").dxDataGrid("instance").deselectAll();
    groupBundleGrid.selectRows(newSeleted);

}

 
function scheduleStep(el) {

    isScheduleStep  = true;

    let data = el.attr("value");
    $("#btn-unschedule-step").hide();

    let chars = data.split("`");
    let step = chars[0];
    let job = chars[1];
    let runtime = chars[2];

 

   
    $('#EditStepModal').modal('show');

    $("#StepNameModal").text(step);


    StepStartDateChanged = true;
    StepEndDateChanged = true;
    machineValues = [];
    personnelValues = [];

    $.each(data.AllocatedMachines, function (i, item) {

        machineValues.push(item.Name);
    });

    $.each(data.AllocatedPersonnels, function (i, item) {

        personnelValues.push(item.Name);
    });


    PassRequirement = 0;
 
    $('#dx-Personnel1').hide();
    $('#dx-Machine1').hide();

    $(".step-machine").hide();
    $(".step-personnel").hide();


    var startDate = $("#dx-StepStartDate").dxDateBox("instance");
    var endDate = $("#dx-StepEndDate").dxDateBox("instance");

    startDate.option("value", new Date());
    endDate.option("value", dateAdd(new Date(), "minute", runtime));

    StepStartDateTimeNew = startDate.option("value")
    StepEndDateTimeNew   = endDate.option("value")

 
    let dxTxtInterval = $("#dx-txtDuration").dxTextBox("instance");

    let duration = getMinutesBetweenDates(new Date(StepStartDateTimeNew), StepEndDateTimeNew );

    let ddhhmm = getDDHHM(duration);

 

    dxTxtInterval.option("value", ddhhmm)
    dxTxtInterval.option("disabled", true);

    JobOrderNameForStep = job;


    let checkBox = $("#dx-checkBox").dxCheckBox("instance");

        checkBox.option("value",true);
}

function getJobOrder(data) {
    
    var chars = data.split("`");
    var job = chars[0];
    var runtime = chars[1];
    $("#btn-edit-step").hide();
    $("#stepsContainer").empty();    
    $("#dx-SearchJobStep").dxTextBox("instance").option("value", "")
    $('#EditJobModal').modal('show');
    //bind JOb Model
    $("#JobNameModal").text(job);
   let startDate = $("#dx-StartDate").dxDateBox("instance");
   let endDate = $("#dx-EndDate").dxDateBox("instance");
    selectedJobOrderNumber = job;
    JobRuntimeInMinutes = runtime
    startDate.option("value", new Date());
    endDate.option("value", dateAdd(new Date(), "minute",runtime));
 
  
}

function convertMinsToHrsMins(minutes) {
    let h = Math.floor(minutes / 60);
    let m = minutes % 60;
  
    return h + 'h ' + m + 'm';
}



function DeleteBindling(id) {


}
function createCapacityTrackerItemType(id) {
    $("#stepChartContainer").empty();
    $("#stepChartContainer").append('<div id="dx-CTItemType' + id + '"></div>')

}

function createCapacityTrackerAssetQualification(id) {


    $("#stepChartContainer").append('<div id="dx-CTAssetQualification' + id + '"></div>')
}

function createCapacityTrackerPersonnelQualification(id) {

    $("#stepChartContainer").append('<div id="dx-CTPersonnelQualification' + id + '"></div>')
}

function createStepGraphItemType(id) {

    $.ajaxSetup({
        async: false
    });

    $.getJSON(urlWithAction + "/GetInventoryItemQty?id=" + id + "&fromDateStr=" + _startDate
        + "&toDateStr=" + _endDate, function (data) {
        itemTypesDataSource = data;
        console.log("item Types Data source:" + JSON.stringify(data));

        $("#dx-CTItemType" + id).dxChart({

            dataSource: itemTypesDataSource,
            size: {
                height: 200,
                width: 9600

            },
            scrollBar: {
                visible: true
            },
            valueAxis: {
                tickInterval: 1,
                grid: {
                    visible: false
                },
                position: "left",
                label: {
                    format: "MM/dd/yyyy"
                    }                
            },
            commonSeriesSettings: {
                type: "steparea",
                argumentField: "Timestamp",
                steparea: {
                    border: {
                        visible: false
                    }
                }
            },
            series: [
                {
                    valueField: "Value",
                    name: selectedItemType,
                    color: "#2596be"           
                },

            ],
            keepLabels: false,
            argumentAxis: {
                valueMarginsEnabled: false,
                label: {
                    format: "MM/dd/yyyy"
                },
                grid: {
                    visible: false
                },
                visualRange: {
                    startValue: 0,
                    endValue: 1
                }
            },
            legend: {
                verticalAlignment: "bottom",
                horizontalAlignment: "center"
            },

        });
    });

 

    $.ajaxSetup({
        async: true
    });
   

}
