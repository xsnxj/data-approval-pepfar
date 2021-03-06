/* global jQuery */
function datasetViewDirective(AppManifest, $translate) {
    var dataSetReportWrapSelector = '.dataset-report-wrap';

    function loadDataSetReport(details, ds, element, scope) {
        var dataSetReportUrl = AppManifest.activities.dhis.href + '/dhis-web-reporting/generateDataSetReport.action';
        var params = {
            ds: ds.id,
            pe: details.period,
            ou: details.orgUnit
        };

        //Dimensions should be based on the mechanisms that are assigned
        //The category should be based on the result of the selection that is done
        //Leave off the dimension if the category is `default`
        //If the dataset has a category(or multiple, in this case one) get the currentSelection items that have that category
        //If the dataset has the category default don't add the dimension
        var datasetCOCNames = _.pluck(ds.categoryCombo.categoryOptionCombos, 'name');
        var datasetCOCIds;
        var hasDefaultCOC = _.contains(datasetCOCNames, '(default)');

        var COsForReport;
        if (!hasDefaultCOC) {
            datasetCOCIds = _.pluck(ds.categoryCombo.categoryOptionCombos, 'id');
            //Filter out the ones that have default as COG
            COsForReport = _.filter(details.currentSelection, function (mechanism) {
                if (_.contains(datasetCOCIds, mechanism.catComboId)) {
                    return true;
                }
                return false;
            });
            // TODO: This picks the fist category and assumes that all the other COs have the same category
            // which might not be true
            params.dimension = COsForReport[0].category + ':' + _.pluck(COsForReport, 'id').join(';');
        }

        jQuery.post(dataSetReportUrl, params).success(function (data) {
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
            //reportElement.find('div.cde p:last-child').remove();

            //Remove the share form
            reportElement.find('div#shareForm').remove();

            //Remove the comment boxes for EA forms
            reportElement.find('.ea-comment').parentsUntil('div').remove();

            //Remove the background and color inline styles and add a class to the items that had a background
            //reportElement.find('[style*="background"]').css('background', '').addClass('dataset-view-highlight');
            //reportElement.find('[style*="color"]').css('color', '');

            scope.reportView[ds.id].content = reportElement;
            scope.updateCurrentViewIfNeeded(ds);
        });
    }

    //TODO: Take this into it's own directive (could be usable for reuse
    function addBackToTop(translation) {
        var backToTop = jQuery('<div class="back-to-top"><i class="fa fa-angle-double-up"></i><span>&nbsp;' + translation + '</span></div>');

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

            scope.hasUnreadableMechanisms = 0;
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
                        if (mechanism.mayReadData === false) {
                            scope.hasUnreadableMechanisms += 1;
                        }

                        if (_.contains(categoryOptionComboIds, mechanism.catComboId)) {
                            result = true;
                        }
                    });
                    return result;
                });

                //Move this out
                jQuery(dataSetReportWrapSelector).html('');

                $translate('Go to top').then(function (translation) {
                    addBackToTop(translation);
                });

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
                    window.console.error(e);
                }
            };

            scope.updateCurrentViewIfNeeded = function (dataSet) {
                if (scope.reportView.currentDataSet &&
                    scope.reportView.currentDataSet.id === dataSet.id) {
                    scope.onChange({}, dataSet);
                }
            };
        }
    };
}

angular.module('PEPFAR.approvals').directive('datasetView', datasetViewDirective);
