
 

$(document).ready(function () {




    window.location.hash = '';
    history.pushState('', document.title, window.location.pathname);


    $(".dx-radiobutton-icon-dot").addClass("arc-radio-input");

    $("#lblJobs").attr("style", "font-weight:bold;color:#37467B")
    $("#lblSteps").attr("style", "font-weight:normal;color:lightgray")
    $("#lblGroupBy").attr("style", "font-weight:normal;color:lightgray");

    $("#lblCalendar").attr("style", "font-weight:bold;color:#37467B");
    $("#lblTimeline").attr("style", "font-weight:normal;color:lightgray");

    $("#lblForward").attr("style", "font-weight:bold;color:#37467B");
    $("#lblBackward").attr("style", "font-weight:normal;color:lightgray");


    $.ajaxSetup({
        async: false
    });

    $.getJSON(resourcesUrl + "/GetProductionStatuses", function (data) {
        statusResources = data;

    });


    $.getJSON(resourcesUrl + "/GetMachines", function (data) {
        machineResources = data;
        machineResourcesDefault = data;


    });

    let userId;
    if (loggedUserId == null)
        userId = 0;
    else
        userId = loggedUserId;



    $.getJSON(resourcesUrl + "/GetPersonnels", function (data) {
        personnelResources = data;
        personnelResourcesDefault = data;
    });

    $.getJSON(resourcesUrl + "/GetUnscheduleJobSummaries?search=", function (data) {

        unscheduledJobs = data;

    });


    GetFrozenZone();

    function GetFrozenZone() {
        $.getJSON(urlWithAction + "/GetFrozenZones", function (data) {


            var sortedList = sortByKey(data, "id");
            frozenZoneSetting = sortedList[sortedList.length - 1];

           
            if (_scheduler != undefined) {
                _scheduler.repaint();
            }

        });
    }




    $.getJSON(resourcesUrl + "/GetUnscheduleJobSteps?search=", function (data) {

        unscheduledSteps = data;
     
    });



    $.getJSON(urlWithAction + "/GetInventoryItemTypes", function (data) {
        itemTypes = data;

    });
   




    let _url = window.location.href + "/api/SchedulerResource";
    _url = _url.replace('//api', "/api");

    $.getJSON(_url + "/GetJobOrders?startDate=" + _startDate + "&endDate=" + _endDate + "&search=" + searchValue, function (data) {

        jobResourceDataSources = data;
        jobResourceDataSourcesDefault = data
       
    });



    $.getJSON(urlWithAction + "/GetUserSettings/?userId=" + userId, function (data) {
        userSetting = data;
 


        let parsedJSON = JSON.parse(JSON.stringify(userSetting));

        if (parsedJSON != undefined) {
            if (parsedJSON.ResourceSelections.length == 0) {


                machineResources.forEach(function (item) {
                    let resource = {};
                    resource.Id = item.MachineId;
                    //  resource.Name = item.MachineName

                    machinesSelectedResources.push(resource);

                });

                personnelResources.forEach(function (item) {
                    let resource = {};
                    resource.Id = item.PersonnelId;
                    //   resource.Name = item.PersonnelName

                    personnelSelectedResources.push(resource);

                });

                jobOrderNumbers.forEach(function (item) {
                    let resource = {};
                    resource.Id = item.Id;
                    //resource.Name = item.JobOrder

                    jobsSelectedResources.push(resource);

                });



            } else {



                parsedJSON.ResourceSelections.forEach(function (resource) {

                    if (resource.SelectedResource == "Machines") {


                        machinesSelectedResources = resource.SelectedValues;

                        if (machinesSelectedResources == null)
                            machinesSelectedResources = [];

                    } else if (resource.SelectedResource == "Personnel") {


                        personnelSelectedResources = resource.SelectedValues;

                        if (personnelSelectedResources == null)
                            personnelSelectedResources = [];

                    } else if (resource.SelectedResource == "Jobs") {
                        jobsSelectedResources = resource.SelectedValues;
                        if (jobsSelectedResources == null)
                            jobsSelectedResources = [];

                    }
                });

                if (machinesSelectedResources.length == 0) {
                    machineResources.forEach(function (item) {
                        let resource = {};
                        resource.Id = item.MachineId;
                        // resource.Name = item.MachineName

                        machinesSelectedResources.push(resource);

                    });
                }

                if (personnelSelectedResources.length == 0) {
                    personnelResources.forEach(function (item) {
                        let resource = {};
                        resource.Id = item.PersonnelId;
                        //resource.Name = item.PersonnelName

                        personnelSelectedResources.push(resource);

                    });
                }

                if (jobsSelectedResources.length == 0) {
                    jobResourceDataSources.forEach(function (item) {
                        let resource = {};
                        resource.Id = item.Id;
                        //  resource.Name = item.JobOrder

                        jobsSelectedResources.push(resource);
                       
                    });
                }
            }
        }



    });


    $.getJSON(urlWithAction + "/GetGroupBundling", function (data) {

        GroupBundling = data;

       
    });



    function PopulateBundlingCandidates() {

        $.getJSON(urlWithAction + "/GetBundleCandidates", function (data) {

            BundlingCandidates = data;

          
        });


    }
    PopulateBundlingCandidates();

    $.ajaxSetup({
        async: true
    });



    Initialize();

    _scheduler.option("dataCellTemplate", function (itemData, itemIndex, itemElement) {
        var date = itemData.startDate;
        var isDisabled = isFrozenZone(date)
        var element = $('<div />');

        if (isDisabled) {
            itemElement.addClass('disable-date');
        } else {

            itemElement.removeClass('disable-date');

            let view = _scheduler.option("currentView");

            if (view == "month")
                itemElement.append(element.append(date.getDate()));


        }
        return itemElement;
    });


    $("#dx-StartDate").dxDateBox({
        type: "datetime",

        width: 200,
        onValueChanged: function (e) {

            if (e.value == null)
                return false;

            if (!e.event)
                return false;

            JobStartDateChanged = true;
            JobStartDateTimePrevious = e.previousValue;
            JobStartDateTimeNew = e.value;

            let newEndDate = dateAdd(new Date(e.value), "minute", JobRuntimeInMinutes);

            let endDate = $("#dx-EndDate").dxDateBox("instance");

            endDate.option("value", newEndDate);
        }
    }).dxValidator({
        validationGroup: "ScheduleJobDates",
        validationRules: [
            {
                type: "required",
                message: FIELD_REQUIRED
            }]
    });

    $("#dx-EndDate").dxDateBox({
        type: "datetime",
        width: 200,
        onValueChanged: function (e) {

            if (!e.event)
                return false;

            if (e.value == null)
                return false;

            JobEndDateChanged = true;
            JobStartDateChanged = true
            let newStartDate = dateAdd(new Date(e.value), "minute", -JobRuntimeInMinutes);
            let startDate = $("#dx-StartDate").dxDateBox("instance");
           
            startDate.option("value", newStartDate);
            JobStartDateTimeNew = startDate.option("value")
            JobEndDateTimePrevious = e.previousValue;
            JobEndDateTimeNew = e.value;
        }
    }).dxValidator({
        validationGroup: "ScheduleJobDates",
        validationRules: [
            {
                type: "required",
                message: FIELD_REQUIRED
            }]
    });;


    $("#dx-StepStartDate").dxDateBox({
        type: "datetime",
        value: new Date(),
        width: 200,
        onValueChanged: function (e) {

            if (!e.event)
                return false;

            if (e.value == null)
                return false;

            StepStartDateChanged = true;


            StepStartDateTimePrevious = e.previousValue;
            StepStartDateTimeNew = e.value;
 


            let duration;
            let dxTxtInterval = $("#dx-txtDuration").dxTextBox("instance");
        
            if (isRunTimeLocked == true) {

                let newEndDate = dateAdd(new Date(e.value), "minute", JobRuntimeInMinutes);
                duration = JobRuntimeInMinutes

                let endDate = $("#dx-StepEndDate").dxDateBox("instance");

                endDate.option("value", newEndDate);


                dxTxtInterval.option("disabled", true);
            } else {
                dxTxtInterval.option("disabled", false);

                let endDate = $("#dx-StepEndDate").dxDateBox("instance");
                duration = getMinutesBetweenDates(new Date(e.value), endDate.option("value"));



                if (duration < 0) {

                    toasterAlert("error", END_DATE_NOT_GREATER_THAN_START_DATE_TEXT)
                    return;
                }

            }

            let ddhhmm = getDDHHM(duration);




            dxTxtInterval.option("value", ddhhmm)




        }
    }).dxValidator({
        validationGroup: "ScheduleStepDates",
        validationRules: [
            {
                type: "required",
                message: FIELD_REQUIRED
            }]
    });;

    $("#dx-StepEndDate").dxDateBox({
        type: "datetime",
        value: new Date(),
        width: 200,
        onValueChanged: function (e) {

            StepEndDateChanged = true
            StepEndDateTimePrevious = e.previousValue;
            StepEndDateTimeNew = e.value;

            if (e.value == null)
                return false;
            if (!e.event)
                return false;

            JobEndDateChanged = true;
            let dxTxtInterval = $("#dx-txtDuration").dxTextBox("instance");
            let duration;
            if (isRunTimeLocked == true) {
                let newStartDate = dateAdd(new Date(e.value), "minute", -JobRuntimeInMinutes);

                let startDate = $("#dx-StepStartDate").dxDateBox("instance");
                duration = JobRuntimeInMinutes


                startDate.option("value", newStartDate);
                StepStartDateTimeNew = startDate.option("value")
                dxTxtInterval.option("disabled", true);
            } else {


                let startDate = $("#dx-StepStartDate").dxDateBox("instance");
                duration = getMinutesBetweenDates(startDate.option("value"), new Date(e.value));





                dxTxtInterval.option("disabled", false);

                if (duration < 0) {

                    toasterAlert("error", END_DATE_NOT_GREATER_THAN_START_DATE_TEXT)
                    return;
                }
            }


            let ddhhmm = getDDHHM(duration);









            dxTxtInterval.option("value", ddhhmm);

            StepStartDateChanged = true;



        }
    }).dxValidator({
        validationGroup: "ScheduleStepDates",
        validationRules: [
            {
                type: "required",
                message: FIELD_REQUIRED
            }]
    });;

    var CheckList = [];

    $("#dx-ChecklistGrid").dxDataGrid({
        dataSource: CheckList,
        editing: {
            mode: "popup",
            allowUpdating: true,
            allowDeleting: true,
            allowAdding: true,
            popup: {
                title: "Checklist Info",
                showTitle: true,
                width: 700,
                height: 525,
                position: {
                    my: "top",
                    at: "top",
                    of: window
                }
            },

            form: {
                items: [{

                    colCount: 2,
                    colSpan: 2,

                    items: ["ChecklistName", "FormNo", "RevisionNo"]
                }]
            }
        },
        columns: [
            {
                dataField: "ChecklistName",
                caption: "Checklist Name",

            },
            {
                dataField: "FormNo",
                caption: "Form No."
            },
            {
                dataField: "RevisionNo",
                caption: "Revision No."
            }
        ]
    });




    $("#dx-Workflow").dxSelectBox({
        dataSource: new DevExpress.data.ArrayStore({

            key: "ID"
        }),
        displayExpr: "Name",
        valueExpr: "ID",

    });

    $("#dx-FinishedGoods").dxTagBox({
        dataSource: new DevExpress.data.ArrayStore({

            key: "ID"
        }),
        displayExpr: "Name",
        valueExpr: "ID",
        searchEnabled: true
    });

    $("#dx-Personnel1").dxTagBox({
        dataSource: new DevExpress.data.ArrayStore({
            data: personnelResources,
            key: "PersonnelId"

        }),

        value: personnelValues,
        displayExpr: "PersonnelName",
        valueExpr: "PersonnelName",
        searchEnabled: true
    });

    $("#dx-Machine1").dxTagBox({
        dataSource: new DevExpress.data.ArrayStore({
            data: machineResources,
            key: "MachineId"

        }),

        value: machineValues,
        displayExpr: "MachineName",
        valueExpr: "MachineName",
        searchEnabled: true

    });


    $("#dx-SearchJobStep").dxTextBox({
        placeholder: SEARCH,
        valueChangeEvent: "keyup",
        onKeyUp: function (e) {
            const keyCode = e.event.key;
            // Event handling commands go here


        },
        onValueChanged: function (data) {




            if (data.value != "") {
                $("#stepsContainer").empty();
                if (currentSteps.length > 0) {
                    currentSteps.forEach(function (step) {

                        let searchData = data.value.toLowerCase()
                        let currentStep = step.StepName.toLowerCase()





                        if (currentStep.indexOf(searchData) != -1) {



                            createEditStepList(step);


                            createPersonnelTagBoxes(step);
                            createMachineTagBoxes(step)


                        }

                    });
                }
            } else {
                $("#stepsContainer").empty();

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

        }




    });



    $("#btn-edit-step").click(function () {

        PersonnelPreviousValuesArr = [];
        MachinePreviousValuesArr = [];

        currentSteps.forEach(function (step) {

            let jobStepPersonnel = {}
            let jobStepMachine = {}

            jobStepPersonnel.StepId = step.Id;
            jobStepPersonnel.PersonnelValues = $("#dx-Personnel" + step.Id).dxTagBox('instance').option("value");


            PersonnelPreviousValuesArr.push(jobStepPersonnel);

            jobStepMachine.StepId = step.Id;
            jobStepMachine.MachineValues = $("#dx-Machine" + step.Id).dxTagBox('instance').option("value");


            MachinePreviousValuesArr.push(jobStepMachine);

        });




        $('#EditStepsModal').modal('show');

        isJobModalShown = true;

        $('#EditJobModal').modal('hide');


    });



    $("#EditStepsModal").on("hidden.bs.modal", function () {



        if (isJobModalShown == true)
            $('#EditJobModal').modal('show');

    });

    function ResetToNoGrouping() {
        selectedGroup = "";
        _scheduler.option("showAllDayPanel", true);

        _scheduler.option("editing.allowDragging", true);
        removeCondensedView();
        $("#dx-Assets").dxDropDownBox("instance").option("disabled", true)
        bindResourceFilter([], "");
        $('#dx-Assets').dxDropDownBox("instance").option("value", null);
    }

    $("#groupingDropdown").dxDropDownButton({
        text: NO_GROUPING,

        keyExpr: "id",
        displayExpr: "text",
        items: actions,
        useSelectMode: true,
        width: 180,

        dropDownOptions: {
            width: 180,
            displayExpr: "name",
            keyExpr: "id",
            selectedItemKey: 1,
        },



        onItemClick: function (e) {

            let text = e.itemData.text
            selectedGroup = text;
            isCondensed == false;
            let calcWidth = 0;
            let height = 0;

            if (text == NO_GROUPING) {
                groups = [""];
                groups.length = 0;
                ResetToNoGrouping();
            }

            if (text == MACHINES) {
                groups = ["MachineName"];


                _scheduler.option("showAllDayPanel", false);

                let view = _scheduler.option("currentView");

                _scheduler.option("editing.allowDragging", true);
                removeCondensedView();

                $("#dx-Assets").dxDropDownBox("instance").option("disabled", false)
                bindResourceFilter(machineResources, "MachineName");
                selectAll();

            }

            if (text == PERSONNEL) {
                groups = ["PersonnelName"];


                _scheduler.option("showAllDayPanel", false);


                _scheduler.option("editing.allowDragging", true);
                removeCondensedView();
                $("#dx-Assets").dxDropDownBox("instance").option("disabled", false)
                bindResourceFilter(personnelResources, "PersonnelName");
                selectAll();
            }

            if (text == JOBS) {


                groups = ["JobOrder"];

                _scheduler.option("editing.allowDragging", false);

                if (btnState)
                    $(".dx-scheduler-header.dx-widget").addClass("fixed");


                removeCondensedView();
                $("#dx-Assets").dxDropDownBox("instance").option("disabled", false)

                bindResourceFilter(jobResourceDataSources, "JobOrder");
                selectAll();
            }

            if (text == MACHINE_CONDENSED) {
                groups = ["MachineName"];

                selectedGroup = MACHINES;

                _scheduler.option("showAllDayPanel", false);

                isCondensed = true;

                _scheduler.option("editing.allowDragging", true);

                if (btnState)
                    $(".dx-scheduler-header.dx-widget").addClass("fixed");

                $("#dx-Assets").dxDropDownBox("instance").option("disabled", false)

                bindResourceFilter(machineResources, "MachineName");
                selectAll();

            }








            _scheduler.option("groups", groups);
            _scheduler.option("views", selectedViewType);
            _scheduler.option("currentView", defaultView);

            let view = _scheduler.option("currentView");


            if (selectedGroup === PERSONNEL || selectedGroup === MACHINES || selectedGroup === MACHINE_CONDENSED) {

                if (view.indexOf("timelineMonth") >= 0) {

                    _scheduler.option("maxAppointmentsPerCell", 1);

                } else {

                    _scheduler.option("maxAppointmentsPerCell", 1);
                }
            } else {

                _scheduler.option("maxAppointmentsPerCell", 1);

            }

            if (selectedGroup == "No Grouping")
                selectedGroup = "";





            if (text == MACHINE_CONDENSED && isCondensed == true) {

                let url = window.location.href + "/css/machinecondensed.css";


                LoadCSS(url).then(function () {

                    GetDataSource();
                    _scheduler.repaint();

                });

            } else
                GetDataSource();


            if (btnState) {
                $(".dx-scheduler-header.dx-widget").addClass("fixed");

            }
        }
    });

    function bindResourceFilter(resources, selectedName) {
        let resource = {};
        selectedResources = [];
        if (selectedGroup == MACHINES || selectedGroup == MACHINE_CONDENSED) {
            resources.forEach(function (item) {

                resource.Id = item.MachineId;
                resource.Name = item.MachineName

                selectedResources.push(resource);
                resource = {};
            });

            if (machinesSelectedResources != undefined) {

                let machineSchedulerResources = [];

                machinesSelectedResources.forEach(function (item) {

                    let machineItem = {};
                    machineItem.MachineName = $.grep(resources, function (e) { return e.MachineId == item.Id }).map(a => a.MachineName).toString()
                    machineSchedulerResources.push(machineItem);

                });

                _scheduler.option("resources[1].dataSource", machineSchedulerResources);
            }


        } else if (selectedGroup == PERSONNEL) {
            resources.forEach(function (item) {
                resource.Id = item.PersonnelId
                resource.Name = item.PersonnelName
                selectedResources.push(resource);
                resource = {};
            });

            if (personnelSelectedResources != undefined) {

                let personnelSchedulerResources = [];

                personnelSelectedResources.forEach(function (item) {

                    let personnelItem = {};
                    personnelItem.PersonnelName = $.grep(resources, function (e) { return e.PersonnelId == item.Id }).map(a => a.PersonnelName).toString();// item.Name;
                    personnelSchedulerResources.push(personnelItem);

                });

                _scheduler.option("resources[2].dataSource", personnelSchedulerResources);
            }

        } else if (selectedGroup == JOBS) {

            resources.forEach(function (item) {
                resource.Id = item.Id;
                resource.Name = item.JobOrder

                selectedResources.push(resource);
                resource = {};
            });

            if (jobsSelectedResources != undefined) {

                let jobsSchedulerResources = [];

                jobsSelectedResources.forEach(function (item) {

                    let jobItem = {};
                    jobItem.JobOrder = $.grep(resources, function (e) { return e.Id == item.Id }).map(a => a.JobOrder).toString()//item.Name;
                    jobsSchedulerResources.push(jobItem);

                });

                _scheduler.option("resources[3].dataSource", jobsSchedulerResources);
            }

        }
        selectedResourceName = selectedName;



        let resourceDataSource = new DevExpress.data.ArrayStore({
            data: selectedResources,
            key: "Id"
        });

        $("#dx-Assets").dxDropDownBox("instance").option("dataSource", resourceDataSource);
        $("#dx-Assets").dxDropDownBox("instance").repaint();
    }


    function removeCondensedView() {
        let url = window.location.href + "/css/machinecondensed.css";


        $('link[href=' + "'" + url + "'" + ']').remove();
    }

    $("#schedulingModeDropdown").dxDropDownButton({
        text: SCHEDULE_STEPS_INDEPENDENTLY,

        keyExpr: "Id",
        displayExpr: "text",
        items: schedulingModes,
        useSelectMode: true,
        width: 230,

        dropDownOptions: {
            width: 230,
            displayExpr: "name",
            keyExpr: "Id",
            selectedItemKey: 1,
        },

        onItemClick: function (e) {
            let value = e.itemData
            selectedMode = value.Id;
       

            GetDataSource();


         
 

            if (btnState) {
                $(".dx-scheduler-header.dx-widget").addClass("fixed");
              
            }

        }


    });

    $("#schedule-toggle").change(function () {


        let state = $(this).prop('checked');

        if (state) {

            $("#lblForward").attr("style", "font-weight:bold;color:#37467B");
            $("#lblBackward").attr("style", "font-weight:normal;color:lightgray");
            scheduleToggleMode = 'FWD'
        } else {
            $("#lblBackward").attr("style", "font-weight:bold;color:#37467B");
            $("#lblForward").attr("style", "font-weight:normal;color:lightgray");
            scheduleToggleMode = 'BKD';


        }
        let insertUrl=""
        if (subject == "StepName")
            insertUrl = insertUrl + "&Mode=" + scheduleToggleMode;
        else
            insertUrl = insertUrl + "?Mode=" + scheduleToggleMode;

         getDataSource = DevExpress.data.AspNet.createStore({
            key: subject,
            loadUrl: url + "?startDate=" + _startDate + "&endDate=" + _endDate + "&search=" + searchValue,
             insertUrl: url + insertUrl,
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

        _scheduler.option("dataSource", getDataSource);
    })

    $("#data-toggle").change(function () {
        let state = $(this).prop('checked');




        let insertUrl = "";



        if (state) {
            action = "/GetJobs";

            subject = "JobOrderNumber";
            btnText = SCHEDULE_JOB;
            updateAction = "/UpdateJob";
            insertAction = "/InsertJob";

            url = window.location.href + "/api/JobData";
            url = url.replace('//api', "/api");
            insertUrl = insertUrl + "?Mode=" + scheduleToggleMode;

            /* $("#btn-schedule-job").html(btnText);*/

            $("#txt-search-job").dxTextBox("instance").option("visible", true)

            $("#dx-search-step").dxTagBox("instance").option("visible", false)


            $(".job-list").empty()

            unscheduledJobs.forEach(function (job) {
                createJobList(job);

            });


            $("#lblJobs").attr("style", "font-weight:bold;color:#37467B");
            $("#lblSteps").attr("style", "font-weight:normal;color:lightgray");

            $("#lblGroupBy").attr("style", "font-weight:normal;color:lightgray");

            $("#groupingDropdown").dxDropDownButton("instance").option("disabled", true)
            ResetToNoGrouping();
            $("#groupingDropdown").dxDropDownButton("instance").option("selectedItemKey", 1)


            groups = [];



            $("#txt-search-schedule").dxTextBox("instance").option("placeholder", SEARCH_JOB);
            _scheduler.option("groups", groups);



            _scheduler.option("editing.allowResizing", false);


        } else {

            jobOrderNumbers = [];
            action = "/GetSteps";
            updateAction = "/UpdateStep";
            insertAction = "/InsertStep";
        

            _scheduler.option("editing.allowResizing", true);

            $("#lblSteps").attr("style", "font-weight:bold;color:#37467B");
            $("#lblJobs").attr("style", "font-weight:normal;color:lightgray");

            url = window.location.href + "/api/StepData?selectedMode=" + selectedMode + "&selectedResource=" + selectedGroup + "&fromResource=" + fromResource;
            url = url.replace('//api', "/api");
            insertUrl = insertUrl + "&Mode=" + scheduleToggleMode;
            $("#lblGroupBy").attr("style", "font-weight:normal;color:#37467B");

            subject = "StepName";
            btnText = SCHEDULE_STEP;


            /*  $("#btn-schedule-job").html(btnText);*/


            $(".job-list").empty()
            $("#txt-search-job").dxTextBox("instance").option("visible", false)
            $("#dx-search-step").dxTagBox("instance").option("visible", true)
            $("#groupingDropdown").dxDropDownButton("instance").option("disabled", false)
            $("#txt-search-schedule").dxTextBox("instance").option("placeholder", SEARCH_STEP);

        }

 
          

        getDataSource = DevExpress.data.AspNet.createStore({
            key: subject,
            loadUrl: url + "?startDate=" + _startDate + "&endDate=" + _endDate + "&search=" + searchValue,
            insertUrl: url + insertUrl,
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

            }
        })

        _scheduler.option("textExpr", subject);
        _scheduler.option("dataSource", getDataSource);
        _scheduler.option("showAllDayPanel", true);





        if (btnState) {
            $(".dx-scheduler-header.dx-widget").addClass("fixed");




        }

    });


    $("#timeview-toggle").change(function () {
        let state = $(this).prop('checked');


        if (state) {

            selectedViewType = basicViews;
            defaultView = "day";

            $("#lblCalendar").attr("style", "font-weight:bold;color:#37467B");
            $("#lblTimeline").attr("style", "font-weight:normal;color:lightgray");
            $("#capacity-container").hide();
            $("#stepChartContainer").empty();


            var index = actions.findIndex(function (o) {
                return o.id === 3;
            })
            if (index !== -1) actions.splice(index, 1);

            $("#groupingDropdown").dxDropDownButton("instance").option("items", actions);

            if (selectedGroup == MACHINES) {
                $("#groupingDropdown").dxDropDownButton("instance").option("text", MACHINES)
                isCondensed == false;
            }

        } else {
            $("#stepChartContainer").empty();
            selectedViewType = timelineViews;
            defaultView = "timelineDay";

            $("#capacity-container").show();

            $("#lblTimeline").attr("style", "font-weight:bold;color:#37467B");
            $("#lblCalendar").attr("style", "font-weight:normal;color:lightgray");

            actions.push({ id: 3, text: MACHINE_CONDENSED })

            let groupactions = sortByKey(actions, "id");

            $("#groupingDropdown").dxDropDownButton("instance").option("items", groupactions);

        }








        _scheduler.option("views", selectedViewType);
        _scheduler.option("currentView", defaultView);


        $('#dx-Assets').dxDropDownBox("getDataSource").reload();
        $('#dx-Assets').dxDropDownBox("instance").repaint();


        if (btnState) {
            $(".dx-scheduler-header.dx-widget").addClass("fixed");
        }

    });


    $("#view-selector").dxRadioGroup({
        items: ["Calendar", "Timeline"],
        value: "Calendar",
        layout: "horizontal",
        onValueChanged: function (data) {


            if (data.value == "Timeline") {

                selectedViewType = timelineViews;
                defaultView = "timelineDay";

                _scheduler.option("height", "800");

            } else {
                selectedViewType = basicViews;
                defaultView = "day";
            }

            _scheduler.option("views", selectedViewType);
            _scheduler.option("currentView", defaultView);




        }



    });


    $("#txt-search-schedule").dxTextBox({
        placeholder: SEARCH_JOB,
        onValueChanged: function (data) {



            searchedJobs = [];
            searchedSteps = [];


            searchValue = data.value;


            getDataSource = DevExpress.data.AspNet.createStore({
                key: subject,
               // loadUrl: url + "?startDate=" + _startDate + "&endDate=" + _endDate + "&search=" + searchValue,
                loadUrl: url + "?search=" + searchValue,
                insertUrl: url,
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

                }
            })

            _scheduler.option("textExpr", subject);
            _scheduler.option("dataSource", getDataSource);

        }

    });


    $("#dx-search-step").dxTagBox({
        dataSource: new DevExpress.data.ArrayStore({
            data: unscheduledSteps,
            key: "JobOrderNumber"

        }),
        placeholder: SELECT_OPTION,
        width: 330,
        displayExpr: "JobOrderNumber",
        valueExpr: "JobOrderNumber",
        searchEnabled: true,

        onValueChanged: function (e) {


            if (!e.event)
                return false;

            let newValues = e.value

            selectedJobForStep = newValues;

            PopulateStepList(newValues)

        }

    })


    $("#txt-search-job").dxTextBox({
        placeholder: SEARCH,
        onValueChanged: function (data) {



            if (subject == "JobOrderNumber") {

                getSearchedUnscheduledJobs(data.value);

            }



        }

    });


    $("#txt-search-bundle").dxTextBox({
        placeholder: SEARCH,
        onValueChanged: function (data) {

            SearchGroupBundle(data.value)

        }
    });


    $(".arc-btn-icon-gray").click(function () {

        btnState = false;
        $("#side-panel").hide();

        $("#scheduler").toggleClass("removeLeftMargin");
        $("#scheduler").removeClass("addLeftMargin")
    });

    $("#btn-refresh").click(function () {
        _scheduler.option("dataSource", getDataSource);
        $("#scheduler").dxScheduler("getDataSource").reload();
    });

    $("#btn-time").click(function () {

        $("#TimeframeModal").modal('show');

    });


    $("#btn-show-bundle").click(function () {

        if (btnState == true)
            CloseScheduleJobPanel();


        if (btnBundlingState == false) {
            OpenGroupBundlingPanel();
        } else {
            CloseGroupBundlingPanel();
        }
    })

    function OpenGroupBundlingPanel() {
        $("#side-panel-bundling").show();
        btnBundlingState = true;
    }

    function CloseGroupBundlingPanel() {
        $("#side-panel-bundling").hide();
        btnBundlingState = false;
    }


    $("#btn-schedule-job").click(function () {

        if (btnBundlingState == true) 
            CloseGroupBundlingPanel();

        if (btnState == false) {
            OpenScheduleJobPanel();

        } else {
            CloseScheduleJobPanel();
        }


    });
    function OpenScheduleJobPanel() {
        btnState = true;
        $("#side-panel").show();

        $("#scheduler").toggleClass("addLeftMargin");
        $("#scheduler").removeClass("removeLeftMargin");

        $(".dx-scheduler-header").addClass("fixed");
    }
    function CloseScheduleJobPanel() {
        btnState = false;
        $("#side-panel").hide();

        $("#scheduler").toggleClass("removeLeftMargin");
        $("#scheduler").removeClass("addLeftMargin")

        $(".dx-scheduler-header").removeClass("fixed");
        $("#scheduler").dxScheduler("instance").repaint();
    }

    function closeNav() {
        btnState = false;
        $("#side-panel").hide();

        $("#scheduler").toggleClass("removeLeftMargin");
        $("#scheduler").removeClass("addLeftMargin")

        $(".dx-scheduler-header").removeClass("fixed");

        $("#scheduler").dxScheduler("instance").repaint();
        $("#scheduler").dxScheduler("getDataSource").reload();

    }

    var createItemElement = function (data) {
        $("<div>")
            .text(data.text)
            .addClass("item dx-theme-background-color dx-theme-text-color")
            .appendTo("#list")
            .dxDraggable({
                group: draggingGroupName,
                data: data,
                clone: true,
                onDragEnd: function (e) {
                    if (e.toData) {
                        e.cancel = true;
                        loadPanel.hide();
                    }
                },
                onDragStart: function (e) {
                    e.itemData = e.fromData;
                }
            });
    }


    $("#list-content").dxScrollView({});
    $("#bundlelist-content").dxScrollView({});

    $(".job-list").dxDraggable({
        data: "dropArea",
        group: draggingGroupName,
        onDragStart: function (e) {
            e.cancel = true;
        }
    });

    $("#icon-plus").dxButton({
        icon: "plus",
        onClick: function (e) {
            DevExpress.ui.notify("The button was clicked");
        }
    });

    $("#icon-check").dxButton({
        icon: "check",
        onClick: function (e) {
            DevExpress.ui.notify("The button was clicked");
        }
    });

 

    unscheduledJobs.forEach(function (job) {
        createJobList(job);
     
    });


    $("#txt-search-job").dxTextBox("instance").option("visible", true)

    $("#dx-search-step").dxTagBox("instance").option("visible", false)

    $("#groupingDropdown").dxDropDownButton("instance").option("disabled", true)




    PopulateBundlingGroup();
    let resources = _scheduler.option("resources");

    for (var i = 0; i < resources.length; i++) {
        resources[i].useColorAsDefault = resources[i].label == "Status";
    }



    $("#dx-txt-interval").dxNumberBox({
        value: 30,
        width: 200,
        /*onValueChanged: function (data) {

            if (data.value <= 0) {
                toasterAlert('error', 'Interval time cannot be equal or less than 0');
               // $("#dx-txt-interval").dxNumberBox("instance").option("value", 30);
            } else {
               // _scheduler.option("cellDuration", data.value);
               // _scheduler.option("dataSource", getDataSource);
               // $("#scheduler").dxScheduler("instance").repaint();


            }
        }*/
    }).dxValidator({
        validationGroup: "Timeframe",
        validationRules: [{
            type: "custom",
            validationCallback: function (options) {
                let valid = true;
                let duration = $("#dx-txt-interval").dxNumberBox("instance");

                let interval = duration.option("value");

                if (interval <= 0)
                    valid = false;

                return valid;
            },
            message: INTERVAL_TIME_VALIDATION
        },

        {
            type: "required",
            message: REQUIRED_INPUT_DATA
        }]
    });;;

    $("#dx-starttime-interval").dxDateBox({
        type: "time",
        width: 200,
        value: new Date().setHours(00, 00, 00),
        interval: 60

    }).dxValidator({
        validationGroup: "Timeframe",
        validationRules: [
            {
                type: "required",
                message: FIELD_REQUIRED
            }]
    });;



    $("#dx-endtime-interval").dxDateBox({
        type: "time",
        width: 200,
        value: new Date().setHours(23, 00, 00),
        interval: 60
    }).dxValidator({
        validationGroup: "Timeframe",
        validationRules: [
            {
                type: "required",
                message: FIELD_REQUIRED
            }]
    });;

    $("#btn-set-timeframe").click(function () {

        let validationGroup = DevExpress.validationEngine.getGroupConfig('Timeframe');

        var result = validationGroup.validate();

        if (result.isValid) {

            let endTime = $("#dx-endtime-interval").dxDateBox("instance");
            let startTime = $("#dx-starttime-interval").dxDateBox("instance");

            let duration_fz = $("#dx-txtDuration-fz").dxTextBox("instance");


            let chexbox = $("#dx-checkBox-lock-job-timeframe").dxCheckBox("instance");

            let duration = $("#dx-txt-interval").dxNumberBox("instance");



            let startDayHour = new Date(startTime.option("value")).getHours()
            let endDayHour = new Date(endTime.option("value")).getHours()
            let interval = duration.option("value");



            loadPanel.show();


            let resourceRequest = {}

            if (loggedUserId == null)
                resourceRequest.UserId = 1;
            else
                resourceRequest.UserId = loggedUserId;


            resourceRequest.Interval = parseInt(interval);
            resourceRequest.StartDayHour = parseInt(startDayHour);
            resourceRequest.EndDayHour = parseInt(endDayHour);




            if (chexbox.option("value") == true) {

                if (duration_fz.option("value") == undefined) {
                    toasterAlert('error', REQUIRED_INPUT_DATA);
                    loadPanel.hide()
                    return;
                }
                if (duration_fz.option("value") == "") {
                    toasterAlert('error', REQUIRED_INPUT_DATA);
                    loadPanel.hide()
                    return;
                }





                let minutesOffset = 0;
                let fromTime = new Date();
                let toTime = new Date();
                let fZoneId = 0;
                let fName = "";
                if (frozenZoneSetting != undefined) {


                    let offSet = getMinutesBetweenDates(frozenZoneSetting.FromTime, frozenZoneSetting.ToTime)



                    minutesOffset = offSet;
                    fName = frozenZoneSetting.Name;
                    fZoneId = frozenZoneSetting.Id;
                } else {

                }

                if (minutesOffset != frozenZoneOffSetInMinutes) {

                    let frozenZoneRequest = {}
                    frozenZoneRequest.Id = fZoneId;
                    frozenZoneRequest.Name = fName;
                    frozenZoneRequest.OffSetInMinutes = frozenZoneOffSetInMinutes;

                    $.ajax({
                        url: urlWithAction + "/SubmitFrozenZone",
                        method: "POST",
                        data: frozenZoneRequest
                    }).always(function () {


                        GetFrozenZone();


                    }).fail(function (msg) {

                        loadPanel.hide()
                        console.log("SUBMIT FROZEN ZONE ERROR: " + JSON.stringify(msg))

                        $('#TimeframeModal').modal('hide');
                    })
                }
            } else {


                if (jQuery.isEmptyObject(frozenZoneSetting) == false) {



                    $.ajax({
                        url: urlWithAction + "/DeleteFrozenZone",
                        method: "DELETE",
                        data: { "id": frozenZoneSetting.Id }
                    }).always(function () {

                        console.log("Deleted frozen zone ");
                        GetFrozenZone();

                    }).fail(function (msg) {

                        loadPanel.hide()
                        console.log("SUBMIT FROZEN ZONE ERROR: " + JSON.stringify(msg))

                        $('#TimeframeModal').modal('hide');
                    })


                }

            }

            if (startDayHour >= endDayHour) {
                toasterAlert('error', END_TIME_NOT_GREATER_THAN_START_TIME_TEXT);
                loadPanel.hide();
                return;
            }

            $.ajax({
                url: urlWithAction + "/SubmitTimeFrame",
                method: "POST",
                data: resourceRequest
            }).always(function () {

                _scheduler.option("endDayHour", new Date(endTime.option("value")).getHours() + 1)
                _scheduler.option("startDayHour", new Date(startTime.option("value")).getHours())


                _scheduler.option("cellDuration", interval);

                _scheduler.option("dataSource", getDataSource);
                $("#scheduler").dxScheduler("instance").repaint();

                $('#TimeframeModal').modal('hide');
                loadPanel.hide()

                if (btnState) {
                    $(".dx-scheduler-header.dx-widget").addClass("fixed");
              
                }



            }).fail(function (msg) {

                loadPanel.hide()
                console.log("SUBMIT TIMEFRAME ERROR: " + JSON.stringify(msg))

                $('#TimeframeModal').modal('hide');
            })

        } else {
            toasterAlert('error', REQUIRED_INPUT_DATA);
            loadPanel.hide();
        }

    })

    $("#dx-checkBox-lock-job-timeframe").dxCheckBox({
        value: false,
        onValueChanged: function (data) {
            let txtDuration_fz = $("#dx-txtDuration-fz").dxTextBox("instance");
            if (data.value  == true)
            {
                if (frozenZoneSetting != undefined) {
                    loadFrozenZoneSetting();
                } else {
               
                 
                  
                    txtDuration_fz.option("disabled", false);
                    txtDuration_fz.option("value", "24:00");
                    frozenZoneOffSetInMinutes = 24 * 60;
         
                
                }

            }
                else {
                txtDuration_fz.option("disabled", true);
                txtDuration_fz.option("value", "");
                frozenZoneOffSetInMinutes=0;
            }
           }
    })
  
    $("#dx-checkBox").dxCheckBox({
        value: true,
        onValueChanged: function (data) {

            let dxTxtInterval = $("#dx-txtDuration").dxTextBox("instance");
            if (data.value == false) {
                isRunTimeLocked = false;

                dxTxtInterval.option("disabled", false);
            } else {
                isRunTimeLocked = true;
                dxTxtInterval.option("disabled", true);
            }
        }
    });
    
    $("#dx-txtDuration").dxTextBox({
        placeholder: "0ddhrsmm",
        mask: "SSS:SS:SS",
        maskInvalidMessage: INVALID_INPUT_DATA,
        maskChar:"0",
        maskRules: {
            S: /[0-9]/
        },
        onValueChanged: function (data) {

 
            let d = data.value.substr(0, 3)
            let h = data.value.substr(3, 2)
            let m = data.value.substr(5, 2)

            d = parseInt(d);
            h = parseInt(h);
            m = parseInt(m);

 

            let runtimeInMinutes = (d * 1440) +(h * 60) + m
            JobRuntimeInMinutes = runtimeInMinutes;
  

            if (Number.isNaN(JobRuntimeInMinutes) == false) {

                let startDate = $("#dx-StepStartDate").dxDateBox("instance");

                let newEndDate = dateAdd(new Date(startDate.option("value")), "minute", JobRuntimeInMinutes);
              
               
                let endDate = $("#dx-StepEndDate").dxDateBox("instance");

                endDate.option("value", newEndDate);


               

            }
            
        }
    });

    $("#dx-txtDuration-fz").dxTextBox({
        placeholder: "0hrsmm",
        mask: "SS:SS",
        value:"24:00",
        maskInvalidMessage: INVALID_INPUT_DATA,
        maskChar: "0",
        maskRules: {
            S: /[0-9]/
        },
        onValueChanged: function (data) {


            let h = data.value.substr(0, 2)
            let m = data.value.substr(2, 2)
          

      
            h = parseInt(h);
            m = parseInt(m);



            let  _frozenZoneOffSetInMinutes =   (h * 60) + m
           


            if (Number.isNaN(_frozenZoneOffSetInMinutes) == false) {
                frozenZoneOffSetInMinutes = _frozenZoneOffSetInMinutes
            }

        }
    });




    $("#dx-ItemTypes").dxDataGrid({
        dataSource: itemTypes,     
        showBorders: false,
        showRowLines: true,
        keyExpr: "Id",
        hoverStateEnabled: true,
        selection: {
            mode: "single"
        },
    });

    $("#capacity-container").hide();

    $("#dx-txt-bundle-job-name").dxTextBox({
        maxLength: 20
    }).dxValidator({
        validationGroup: "BundlingGroup",    
        validationRules: [
            {
                type: "required",
                message: FIELD_REQUIRED
            }]
    });;


    $("#btn-add-edit-bundle-ok").click(function () {

  
        let validationGroup = DevExpress.validationEngine.getGroupConfig('BundlingGroup');

        

        var result = validationGroup.validate();
        if (result.isValid) {

            loadPanel.show();
             

            if (isAdd) {
                if (selectedBundlingCandidates.length < 2) {

                    loadPanel.hide();
                    toasterAlert("error", BUNDLING_MIN);
                    return;
                }
                AddBundling();
            }
            else {
                EditBundling();
            }
        }
    })    
    groupBundleGrid = $("#dx-bundling-grid").dxDataGrid({
        dataSource: BundlingCandidates,
        columns: [
           
            {
                dataField: "JobOrderNumber",
                caption: "Job"
            },
            {
                dataField: "StepName",
                caption: "Step"
            }, {
                dataField: "ScheduledStartDateTime",
                caption: "Start Time",
                dataType: "datetime"
            }, {
                dataField: "ScheduledEndDateTime",
                caption: "End Time",
                dataType: "datetime"
            }
        ],

        loadPanel: {
            enabled: true,
        },

        showBorders: true,
        filterRow: {
            visible: true
        },
        paging: {
            pageSize: 10
        },
        selection: {
            mode: "multiple",
            showCheckBoxesMode: "always",
            selectAllMode: "page"
        },
        onSelectionChanged: function (selectedItems) {




            selectedBundlingCandidates = selectedItems.selectedRowKeys;
           


            totalBundlingRuntime = 0;
            runtimeValues = [];
            if (selectedBundlingCandidates.length > 0) {
                selectedBundlingCandidates.forEach(function (item) {

                    if (item.RuntimeInMinutes != undefined)
                        runtimeValues.push(item.RuntimeInMinutes);
                });

                let runtime = Math.abs(Math.max(...runtimeValues));

                $("#dx-txt-bundle-runtime").dxTextBox("instance").option("value", runtime);
            } else
                $("#dx-txt-bundle-runtime").dxTextBox("instance").option("value", "");

        }     
    }).dxDataGrid("instance");

    $("#dx-txt-bundle-runtime").dxTextBox({
    });


    var currentTarget;


    $("#btn-unschedule-job").click(function () {

        let jobOrderNumber = $("#JobNameModal").text()

        let data = {};
        data.JobOrderNumber = jobOrderNumber;

        Unschedule(data);
    });

    $("#btn-unschedule-step").click(function () {

        let stepName = $("#StepNameModal").text();
        let jobOrderNumber = JobOrderNameForStep;

        let data = {};
        data.JobOrderNumber = jobOrderNumber;
        data.StepName = stepName;

        Unschedule(data);
    });
    $("#appointmentContextMenu").dxContextMenu({
        target: ".dx-scheduler-appointment",
        items: [
            { text: UNSCHEDULE_CONTEXTMENU}
            
        ],
        onItemClick: function (e) {
            var data = $(currentTarget).parents(".dx-item").data("dxItemData");

            Unschedule(data);

          
        },
        onShowing: function (e) {
            currentTarget = e.jQEvent.target;
        }
    });


    function Unschedule(data) {

        isUnscheduled = true;
        loadPanel.show();
        let unscheduleData = {};
        if (subject == "StepName") {

            unscheduleData.StepName = data.StepName;
            unscheduleData.JobOrderNumber = data.JobOrderNumber;
         

        } else {
            unscheduleData.JobOrderNumber = data.JobOrderNumber;
            $('#EditJobModal').modal('hide');
        }

      

        $.ajax({
            url: urlWithAction + "/UnscheduleJob",
            method: "POST",
            data: unscheduleData
        }).always(function () {

            if (subject != "StepName") {
                setTimeout(function () {
                    $.getJSON(resourcesUrl + "/GetUnscheduleJobSummaries?search=", function () {

                    }).done(function (data) {
                        unscheduledJobs = [];
                        unscheduledJobs = data;
                 
                        $('#EditStepModal').modal('hide');
                        

  
                        $("#txt-search-job").dxTextBox("instance").option("value", "")
                        $(".job-list").empty();


                        unscheduledJobs.forEach(function (job) {
                            createJobList(job);
                        });

                        $.getJSON(resourcesUrl + "/GetUnscheduleJobSteps?search=", function () {
                        }).done(function (data) {
                            unscheduledSteps = [];
                            unscheduledSteps = data;


                       


                            let searchStepSource = new DevExpress.data.ArrayStore({
                                data: unscheduledSteps,
                                key: "JobOrderNumber"
                            });

                            let stepJobStepSearch = $("#dx-search-step").dxTagBox("instance");
                            stepJobStepSearch.option("dataSource", searchStepSource);

                            _scheduler.option("dataSource", getDataSource);
                            $("#scheduler").dxScheduler("getDataSource").reload().then(() => {
                                loadPanel.hide();
                            });
 

                        }).fail(function (msg) {


                            toasterAlert("error", SERVER_ERROR);

                            console.log("Error: " + JSON.stringify(msg.responseText))

                            loadPanel.hide();
                        });;;

                    }).fail(function (msg) {


                        toasterAlert("error", SERVER_ERROR);

                        console.log("Error: " + JSON.stringify(msg.responseText))
                        loadPanel.hide();

                    });;;
                }, 3000);
            } else {

               
                setTimeout(function () {
                    $.getJSON(resourcesUrl + "/GetUnscheduleJobSteps?search=", function () {
                    }).done(function (data) {
                        unscheduledSteps = [];
                        unscheduledSteps = data;

                        $(".job-list").empty()
                        $('#EditJobModal').modal('hide');


                        let searchStepSource = new DevExpress.data.ArrayStore({
                            data: unscheduledSteps,
                            key: "JobOrderNumber"
                        });

                        let stepJobStepSearch = $("#dx-search-step").dxTagBox("instance");
                        stepJobStepSearch.option("dataSource", searchStepSource);


                        if (selectedJobForStep.length > 0) {
                            stepJobStepSearch.option("value", selectedJobForStep);
                            PopulateStepList(selectedJobForStep);
                        }


                        _scheduler.option("dataSource", getDataSource);
                        $("#scheduler").dxScheduler("getDataSource").reload().then(() => {
                            loadPanel.hide();
                        });

                    
                      

                    }).fail(function (msg) {


                        toasterAlert("error", SERVER_ERROR);

                        console.log("Error: " + JSON.stringify(msg.responseText))
                        loadPanel.hide();

                    });;;
                }, 3000);

               
            }
           
          

        }).fail(function (msg) {

            loadPanel.hide();
        })


    }

    loadUserSetting();
    loadFrozenZoneSetting();


    function processSelection(selectedItems) {

        let item = {};
        let selectedResourceItem = {}
        selectedResources = [];
        let userId = loggedUserId;
        if (selectedGroup == MACHINES || selectedGroup == MACHINE_CONDENSED) {
             machinesSelectedResources = []
            let _machineResources = [];
            selectedItems.forEach(function (resource) {
             
                item.MachineName = resource.Name;
                selectedResourceItem.Id = resource.Id;
                selectedResourceItem.Name = resource.Name;

                _machineResources.push(item);
        
                machinesSelectedResources.push(selectedResourceItem)
                item = {};
                selectedResourceItem = {}

          
            });
            _scheduler.option("resources[1].dataSource", _machineResources);

           

        } else if (selectedGroup == PERSONNEL) {
            let _personnelResources = [];
            personnelSelectedResources = [];
            selectedItems.forEach(function (resource) {
             
                item.PersonnelName = resource.Name;
                selectedResourceItem.Id = resource.Id;
                selectedResourceItem.Name = resource.Name;

                _personnelResources.push(item);
                personnelSelectedResources.push(selectedResourceItem);
                selectedResourceItem = {}
                item = {};

            });
          
            _scheduler.option("resources[2].dataSource", _personnelResources);
          
        } else if (selectedGroup == JOBS) {
            let _jobResourceDataSources = [];
            jobsSelectedResources=[]
            selectedItems.forEach(function (resource) {

                // item.Id = resource.ID;
                item.JobOrder = resource.Name;
                selectedResourceItem.Id = resource.Id;
                selectedResourceItem.Name = resource.Name
                      
                _jobResourceDataSources.push(item);
                jobsSelectedResources.push(selectedResourceItem)
                item = {};
                selectedResourceItem = {}

            });

            _scheduler.option("resources[3].dataSource", _jobResourceDataSources);
        
        }
        updateResourceSettings(userId);
    }

  

    $('#dx-Assets').dxDropDownBox({
        placeholder: SELECT_OPTION,
        valueExpr: "Id",
        displayExpr: "Name",
        contentTemplate: function (e) {
           
            var $list = $("<div id='dxAssetsList'>").dxList({
                    dataSource: e.component.option("dataSource"),
                    valueExpr: "Id",
                    searchEnabled: true,
                    searchExpr: "Name",
                    displayExpr: "Name",
                    showSelectionControls: true,
                    selectionMode: "all",
                    selectAllMode: "allPages",
                    value: "Select All",
                    onSelectionChanged: function (e) {


                        var selectedItems = e.component.option("selectedItems");


                        e.component.option("value", selectedItems);

                        let selectedObjects = DevExpress.data.query(selectedItems)
                            .select("Name")
                            .toArray();

                        let selectedNames = [];

                        selectedObjects.forEach(function (item) {
                            let name = item.Name;
                            selectedNames.push(name);

                        })

                        $('#dx-Assets').dxDropDownBox("instance").option("value", selectedNames.join(', '))


                        processSelection(selectedItems);

                    },
                    onContentReady: function (args) {
                      //syncSelection(args.component, value);
                    }
                });


            listView = $list.dxList("instance");

            if (selectedGroup == MACHINES || selectedGroup == MACHINE_CONDENSED) {

                // list.option("selectedItemKeys", DevExpress.data.query(machinesSelectedResources).select("Id")
                //  .toArray());
                let selectedItems = $list.dxList("instance").option("selectedItems");
                $list.dxList("instance").option("selectedItems", machinesSelectedResources);


                machinesSelectedResources.forEach(function (key) {
                    $list.dxList("instance").selectItem(key);
                });

            } else if (selectedGroup == PERSONNEL) {
                $list.dxList("instance").option("selectedItems", personnelSelectedResources);
                personnelSelectedResources.forEach(function (key) {
                    $list.dxList("instance").selectItem(key);
                });

            } else if (selectedGroup == JOBS) {

                $list.dxList("instance").option("selectedItems", jobsSelectedResources);

                jobsSelectedResources.forEach(function (key) {
                    $list.dxList("instance").selectItem(key);
                });
            }
 
            return $list;
        },               
    });
    function selectAll() {
        let dropDownBox = $('#dx-Assets').dxDropDownBox("instance");
        dropDownBox.getDataSource().load().done(function (data) {

            if (selectedGroup == MACHINES || selectedGroup == MACHINE_CONDENSED) {

                // list.option("selectedItemKeys", DevExpress.data.query(machinesSelectedResources).select("Id")
                //  .toArray());

                var queryResult = DevExpress.data.query(machinesSelectedResources)
                    .select("Id")
                    .toArray();

                let machineNames = [];
                let machineIdAndNames = [];

                queryResult.forEach(function (item) {

                    let name = null;
                    let resource = {}
                    name = $.grep(machineResourcesDefault, function (e) { return e.MachineId == item.Id }).map(a => a.MachineName).toString()

                    resource.Id = item.Id;
                    resource.Name = name;

                    machineIdAndNames.push(resource);
                    machineNames.push(name);

                });

              


                $('#dx-Assets').dxDropDownBox("instance").option("value", machineNames)
               // processSelection(machineIdAndNames);

         

            } else if (selectedGroup == PERSONNEL) {
    

            
                var queryResult = DevExpress.data.query(personnelSelectedResources)
                    .select("Id")
                    .toArray();

                let Names = [];

                queryResult.forEach(function (item) {

                    let name = null;
                      name = $.grep(personnelResourcesDefault, function (e) { return e.PersonnelId == item.Id }).map(a => a.PersonnelName).toString()

                    Names.push(name);

                });
                


                $('#dx-Assets').dxDropDownBox("instance").option("value", Names.join(', '))
            } else if (selectedGroup == JOBS) {

            
             
                var queryResult = DevExpress.data.query(jobsSelectedResources)
                    .select("Id")
                    .toArray();


                let Names = [];

                queryResult.forEach(function (item) {

                    let name = null;
                     name = $.grep(jobResourceDataSourcesDefault, function (e) { return e.Id == item.Id }).map(a => a.JobOrder).toString()

                    Names.push(name);

                });




                $('#dx-Assets').dxDropDownBox("instance").option("value", Names.join(', '))
            }
        });


      //  $('#dx-Assets').dxDropDownBox("instance").repaint();

 
    }

    var syncSelection = function (list, value) {


        if (!value || value == undefined) {
            list.unselectAll();
            return;
        } else {

            value.forEach(function (key) {
                list.selectItem(key);
            });
        }
    };

    $("#dx-Assets").dxDropDownBox("instance").option("disabled", true)




   

    $("#dx-ItemTypes").dxDataGrid({
        dataSource: itemTypes,
        columns: [

            {
                dataField: "Id",
                caption: "Id",
                width: 50
            },
            {
                dataField: "Name",
                caption: "Name",
                width: 200
            }, {
                dataField: "Description",
                caption: "Description",
                width: 300
            } 
        ],

        loadPanel: {
            enabled: true,
        },

        showBorders: true,
        filterRow: {
            visible: true
        },
        paging: {
            pageSize: 10
        },
 

        showBorders: false,
        showRowLines: true,

        hoverStateEnabled: true,
        selection: {
            mode: "single"
        }, onSelectionChanged: function (selectedItems) {
            var data = selectedItems.selectedRowsData[0];
            if (data) {
                let itemName = data.Name;
                let id = data.Id;

                selectedItemType = itemName;
                createCapacityTrackerItemType(id);
                createStepGraphItemType(id);

                $("#CapacityTrackingModal").modal('hide');
            }
        }
    });

});//DOCUMENT READY END

function loadUserSetting() {

    let endTime = $("#dx-endtime-interval").dxDateBox("instance");
    let startTime = $("#dx-starttime-interval").dxDateBox("instance");
    let duration = $("#dx-txt-interval").dxNumberBox("instance");
   

    endTime.option("value", new Date().setHours((userSetting.CalendarToHour),0,0,0)) 

    startTime.option("value", new Date().setHours(userSetting.CalendarFromHour,0,0,0));

    duration.option("value", userSetting.GridIntervalInMinutes);

 

    _scheduler.option("endDayHour", userSetting.CalendarToHour + 1)
    _scheduler.option("startDayHour", userSetting.CalendarFromHour)

    _scheduler.option("cellDuration", userSetting.GridIntervalInMinutes);
    _scheduler.option("cellDuration", userSetting.GridIntervalInMinutes);

}
function loadFrozenZoneSetting() {
    let txtDuration_fz = $("#dx-txtDuration-fz").dxTextBox("instance");

 
    let chexbox = $("#dx-checkBox-lock-job-timeframe").dxCheckBox("instance");


        if (jQuery.isEmptyObject(frozenZoneSetting) == false) {
            txtDuration_fz.option("disabled", false);

            frozenZoneOffSetInMinutes = getMinutesBetweenDates(frozenZoneSetting.FromTime, frozenZoneSetting.ToTime);

            let offSet =  getHoursAndMinutes(frozenZoneOffSetInMinutes);

       

         
            txtDuration_fz.option("value", offSet)
            chexbox.option("value", true);

        } else {

            txtDuration_fz.option("value", "");
            chexbox.option("value", false);
            txtDuration_fz.option("disabled", true);            
        }   
}


function RefreshBundlingCandidates() {
    $.ajaxSetup({
        async: false
    });

    $.getJSON(urlWithAction + "/GetBundleCandidates", function (data) {

        BundlingCandidates = data;

 
    });



    $.ajaxSetup({
        async: true
    });

    $("#dx-bundling-grid").dxDataGrid("instance").option("dataSource", BundlingCandidates);
}

function AddBundling() {

    let bundleInfo = {};

    let bundleInfoItems = [];

    selectedBundlingCandidates.forEach(function (item) {

        let bundleInfoItem = {};
        bundleInfoItem.JobOrderNumber = item.JobOrderNumber;
        bundleInfoItem.StepName = item.StepName;

        bundleInfoItems.push(bundleInfoItem);
    });

    bundleInfo.Name = $("#dx-txt-bundle-job-name").dxTextBox("instance").option("value");
    bundleInfo.BundledDuration = $("#dx-txt-bundle-runtime").dxTextBox("instance").option("value");
    bundleInfo.BundleInfoItems = bundleInfoItems;
 







    $.ajax({
        url: urlWithAction + "/CreateBundle",
        method: "POST",
        data: bundleInfo
    }).done(function (result) {

        if (result.IsSuccess == false) {

            let errorMessage = "";
            switch (result.ErrorCode) {

                case 920:

                    errorMessage = BUNDLING_EXIST.replace('{jobOrders}', result.Parameters[0].Value.join(', '));

                    errorMessage = result.Error;
                    break;
                case 0:
                    errorMessage = BUNDLING_MIN;
                    break;
            }


            loadPanel.hide();

            toasterAlert("error", errorMessage);
            return;
        }


        selectedBundlingCandidates = [];
        totalBundlingRuntime = 0;

        GroupBundling = [];

        setTimeout(function () {

            $.getJSON(urlWithAction + "/GetGroupBundling", function (data) { 

                GroupBundling = data;

            
            }).done(function (data) {

                PopulateBundlingGroup();



            });



            loadPanel.hide();





            toasterAlert("success", ALERT_SAVE_SUCCESS);
        }, 3000);

        $("#AddEditBundleGroupModal").modal('hide');
        $("#dx-txt-bundle-runtime").dxTextBox("instance").option("value", "");
        $("#dx-txt-bundle-job-name").dxTextBox("instance").option("value", "");
        $("#dx-txt-bundle-job-name").dxTextBox("instance").option("isValid", true);
        $("#dx-bundling-grid").dxDataGrid("instance").deselectAll();


        RefreshBundlingCandidates();
   

    }).fail(function (msg) {


        toasterAlert("error", SERVER_ERROR);

        console.log("Error: " + JSON.stringify(msg.responseText))
        loadPanel.hide();

    });

}



function EditBundling() {

    let bundleInfo = {};

    let bundleInfoItems = [];

    selectedBundlingCandidates.forEach(function (item) {

        let bundleInfoItem = {};
        bundleInfoItem.JobOrderNumber = item.JobOrderNumber;
        bundleInfoItem.StepName = item.StepName;

        bundleInfoItems.push(bundleInfoItem);
    });

 
    bundleInfo.Name = $("#dx-txt-bundle-job-name").dxTextBox("instance").option("value");
    bundleInfo.BundledDuration = $("#dx-txt-bundle-runtime").dxTextBox("instance").option("value");
    bundleInfo.BundleInfoItems = bundleInfoItems;
    bundleInfo.Id = selectedBundlingId;

 

    $.ajax({
        url: urlWithAction + "/UpdateBundle",
        method: "PUT",
        data: bundleInfo
    }).done(function (result) {
        loadPanel.hide();
        if (result.IsSuccess == false) {

            let errorMessage = "";
            switch (result.ErrorCode) {

                case 921:
                    errorMessage = BUNDLING_NOT_FOUND.replace('{bundleId}', result.Parameters[0].Value);
                    break;
                case 0:
                    errorMessage = BUNDLING_MIN;
                    break;
            }


            loadPanel.hide();

            toasterAlert("error", errorMessage);
            return;
        }

        selectedBundlingCandidates = [];
        totalBundlingRuntime = 0;

        GroupBundling = [];

        setTimeout(function () {

            $.getJSON(urlWithAction + "/GetGroupBundling", function (data) {

                GroupBundling = data;

             
            }).done(function (data) {

                PopulateBundlingGroup();




                loadPanel.hide();

                toasterAlert("success", ALERT_SAVE_SUCCESS);
            });
        }, 3000);

        toasterAlert("success", ALERT_SAVE_SUCCESS);

        $("#AddEditBundleGroupModal").modal('hide');
        $("#dx-txt-bundle-runtime").dxTextBox("instance").option("value", "");
        $("#dx-txt-bundle-job-name").dxTextBox("instance").option("value", "");
        $("#dx-txt-bundle-job-name").dxTextBox("instance").option("isValid", true);
        $("#dx-bundling-grid").dxDataGrid("instance").deselectAll();

        RefreshBundlingCandidates();


    }).fail(function (msg) {


        toasterAlert("error", SERVER_ERROR);

        console.log("Error: " + JSON.stringify(msg.responseText))

        loadPanel.hide();
    });
}