function datasetViewDirective() {
    var dataSetReportWrapSelector = '.dataset-report-wrap';
    //http://localhost:8080/dhis/dhis-web-reporting/generateDataSetReport.action
    //?ds=cIGsv0OBVi8&pe=201409&ou=HfVjCurKxh2&dimension=BOyWrF33hiR%3ABnjwQmbgK1b&cog=BnjwQmbgK1b

    //http://localhost:8080/dhis/dhis-web-reporting/generateDataSetReport.action
    //?ds=Zqg76KonUx1
    // &
    // pe=2014&ou=HfVjCurKxh2
    // &
    // selectedUnitOnly=false
    // &
    // dimension=SH885jaRe0o:LPeJEUjotaB        - Funding Mechanism C : 1000 - Apple USAID Mechanism CO
    // &
    // dimension=BOyWrF33hiR:CSPJnuxBAnz        - Implementing Partner COG : University of Washington CO
    // &
    // dimension=bw8KHXzxd9i:NLV6dy7BE2O        - Funding Agency COG : USAID CO


    function loadDataSetReport(details, ds, element, scope) {
        var dataSetReportUrl = '../dhis-web-reporting/generateDataSetReport.action';
        var params = {
            ds: ds.id,
            pe: details.period,
            ou: details.orgUnit,
            dimension: details.currentSelection[0].category + ':' + _.pluck(details.currentSelection, 'id').join(';'),
//            cog: 'BnjwQmbgK1b'
        };
        var urlParams = _.map(params,function (value, key) {
            return [key, value].join('=');
        }).join('&');

        var reportUrl = [dataSetReportUrl, urlParams].join('?');

        jQuery.get(reportUrl).success(function (data) {
            scope.$apply(function () {
                scope.details.loaded += 1;
            });
            var reportElement = jQuery('<div class="dataset-view"></div>').append(data);

            var h3Elements = reportElement.find('h3');
            var toRemoveElements = [];

            h3Elements.first().html(ds.name)
                .attr('id', ds.id);

            if (h3Elements.length > 1) {
                h3Elements.each(function (index, element) {
                    if (index > 0) {
                        toRemoveElements.push(element);
                    }
                });
            }

            _.each(toRemoveElements, function (element) {
                jQuery(element).remove();
            });

            //Remove the hidden input fields
            reportElement.find('input[type="hidden"]').remove();

            //Remove the userinfo field
            reportElement.find('div#userInfo').remove();

            //Remove empty p element
            reportElement.find('div.cde p:last-child').remove();

            //Remove the share form
            reportElement.find('div#shareForm').remove();

            //Remove the background and color inline styles and add a class to the items that had a background
            reportElement.find('[style*="background"]').css('background', '').addClass('dataset-view-highlight');
            reportElement.find('[style*="color"]').css('color', '');

            scope.reportView[ds.id].content = reportElement;
            scope.updateCurrentViewIfNeeded(ds);
        });
    }

//    function addLinksToReports(dataSets, element) {
//        var linkElement = jQuery('<div class="data-set-report-links"><ul></ul></div>');
//        var ulElement = linkElement.children('ul');
//
//        _.each(dataSets, function (dataSet) {
//            var linkElement = jQuery('<li><i class="fa fa-file"></i> ' + dataSet.name + '</li>');
//
//            linkElement.on('click', function (event) {
//                var element = jQuery('#' + dataSet.id);
//                var position;
//
//                if(element.length <= 0) { return; }
//                position = element.position();
//
//                window.scrollTo(0, position.top);
//            });
//
//            ulElement.append(linkElement);
//        });
//
//        element.prepend(linkElement);
//    }

    //TODO: Take this into it's own directive (could be usable for reuse
    function addBackToTop() {
        var backToTop = jQuery('<div class="back-to-top"><i class="fa fa-angle-double-up"></i> Back to top</div>');

        backToTop.on('click', function () {
            window.scrollTo(0, 0);
        });

        jQuery('.view-wrap').append(backToTop);
    }


    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'datasets/datasetsview.html',
        scope: {},
        link: function (scope, element) {
            scope.reportView = {
                actions: {
                    approve: { count: 0 },
                    unapprove: { count: 0 },
                    accept: { count: 0 },
                    unaccept: { count: 0 }
                }
            };

            scope.$on('DATAVIEW.update', function (event, details) {
                scope.details = details;
                scope.checkValues();
            });

            scope.checkValues = function () {
                var details = scope.details;

                if (details.orgUnit &&
                    details.period &&
                    details.dataSets &&
                    details.currentSelection &&
                    details.actions) {

                    scope.loadReports();
                }
            };

            //For each dataset


            scope.loadReports = function () {
                var details = scope.details;
                scope.details.dataSetsFilteredByMechanisms = _.filter(details.dataSets, function (dataSet) {
                    var result = false;
                    var categoryOptionComboIds;

                    if (!dataSet.categoryCombo || !angular.isArray(dataSet.categoryCombo.categoryOptionCombos)) {
                        return false;
                    }

                    categoryOptionComboIds = _.pluck(dataSet.categoryCombo.categoryOptionCombos, 'id');

                    _.each(scope.details.currentSelection, function (mechanism) {
                        if (_.contains(categoryOptionComboIds, mechanism.catComboId)) {
                            result = true;
                        }
                    });
                    return result;
                });

                //Move this out
                jQuery(dataSetReportWrapSelector).html('');

                addBackToTop();

                scope.details.loaded = 0;
                scope.reportView.currentDataSet = scope.details.dataSetsFilteredByMechanisms[0];
                scope.details.dataSetsFilteredByMechanisms.forEach(function (item) {
                    loadDataSetReport(scope.details, item, element.find(dataSetReportWrapSelector), scope);
                    scope.reportView[item.id] = {};
                    scope.reportView[item.id].content = angular.element('<div class="report-loading-message"><i class="fa fa-circle-o-notch fa-spin"></i> Loading report: <span class="report-name">' + item.name + '</span></div>');
                });

                //Add the first element
                element.find(dataSetReportWrapSelector).append(scope.reportView[scope.details.dataSetsFilteredByMechanisms[0].id].content);
            };

            scope.onChange = function ($event, $item) {
                try {
                    if (scope.reportView[$item.id].content) {
                        if (element.find(dataSetReportWrapSelector).children().length > 0) {
                            element.find(dataSetReportWrapSelector).children().replaceWith(scope.reportView[$item.id].content);
                        } else {
                            element.find(dataSetReportWrapSelector).append(scope.reportView[$item.id].content);
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            };

            scope.updateCurrentViewIfNeeded = function (dataSet) {
                if (scope.reportView.currentDataSet &&
                    scope.reportView.currentDataSet.id === dataSet.id) {
                    scope.onChange({}, dataSet);
                }
            };

// TODO: Reconsider if we want to use this "Drag scroll"
//            (function ($) {
//                var clicked = false
//                var clickX;
//                var wrapSelector = dataSetReportWrapSelector;
//
//                function enableScroll(e) {
//                    $(wrapSelector).scrollLeft($(wrapSelector).scrollLeft() + ((clickX - e.pageX) / 2))
//                }
//
//
//                $(wrapSelector).on({
//                    'mousemove': function(e) {
//                        clicked && enableScroll(e);
//                    },
//                    'mousedown': function(e) {
//                        clicked = true;
//                        clickX = e.pageX;
//                        $(wrapSelector).toggleClass('noselect');
//                    },
//                    'mouseup': function() {
//                        clicked = false;
//                        $(wrapSelector).toggleClass('noselect');
//                    }
//                });
//            })(jQuery);

        }
    };
}

angular.module('PEPFAR.approvals').directive('datasetView', datasetViewDirective);
