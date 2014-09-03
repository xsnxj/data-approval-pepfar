describe('Dataset group selector directive', function () {
    var element;
    var scope;
    var dataSetGroupService = dataSetGroupServiceMock();

    beforeEach(module('datasets/datasetgroupselector.html'));
    beforeEach(module('PEPFAR.approvals', {
        dataSetGroupService: dataSetGroupService
    }));
    beforeEach(inject(function ($rootScope, $compile) {
        scope = $rootScope.$new();

        element = angular.element('<dataset-group-selector dataset-groups="datasetGroups"></dataset-group-selector>');

        element = $compile(element)(scope);
        scope.$digest();
    }));

    it('should have a class dataset-group-selector', function () {
        expect(element).toHaveClass('dataset-group-selector');
    });

    it('should have a select child', function () {
        expect(element.children().length).toBe(1);
        expect(element.children().first().prop('tagName')).toBe('SELECT');
    });

    describe('select', function () {
        var selectElement;
        beforeEach(function () {
            dataSetGroupService.datasetGroups = ['MER', 'EA'];
            scope.$apply();

            selectElement = element.children().first();
        });

        it('should have no options when there are no dataset groups', function () {
            dataSetGroupService.datasetGroups = [];
            scope.$apply();

            expect(selectElement.children().length).toBe(1);
        });

        it('should have options when they are set onto the scope', function () {
            expect(selectElement.children().length).toBe(2);
        });

        it('should display the options with the right names', function () {
            expect(selectElement.children().first().text()).toBe('MER');
            expect(selectElement.children().last().text()).toBe('EA');
        });

        it('should have the option id as values', function () {
            expect(selectElement.children().first().val()).toBe('0');
            expect(selectElement.children().last().val()).toBe('1');
        });
    });

    describe('on change', function () {
        var selectElement;
        beforeEach(function () {
            selectElement = element.children().first();
        });

        it('should call the onChange function on the scope', function () {
            selectElement.change();
        });
    });

    describe('initialization with values of dataset groups', function () {
        beforeEach(inject(function ($rootScope, $compile) {
            scope = $rootScope.$new();
            scope.datasetGroups = [ 'MER', 'EA' ];

            element = angular.element('<dataset-group-selector dataset-groups="datasetGroups"></dataset-group-selector>');

            element = $compile(element)(scope);
            scope.$digest();
        }));

        it('should only display the options', function () {
            expect(element.find('select').children().length).toBe(2);
        });
    });
});
