describe('Dataset view directive', function () {
    var element, scope;

    beforeEach(module('datasets/datasetsview.html'));
    beforeEach(module('PEPFAR.approvals'));
    beforeEach(inject(function ($rootScope, $compile) {
        scope = $rootScope.$new();
        element = angular.element('<dataset-view details="details"></dataset-view>')

        scope.details =  {};

        $compile(element)(scope);
        scope.$digest();
    }));

    it('should compile', function () {
        expect(element.prop('tagName')).toBe('DIV');
    });

    it('should have the class dataset-view-wrap', function () {
        expect(element).toHaveClass('dataset-view-wrap');
    });

    it('should call the watch when details is updated', function () {
        scope.details =  {
            dataSets: []
        };
        scope.$apply();

        //TODO: there is no way to test this without getting the isolated scope?
    });
});
