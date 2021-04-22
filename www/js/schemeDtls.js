﻿/// <reference path="jquery-2.2.4.js" />
/// <reference path="utils.js" />

var cmsNoDocument = '';
var cmsNoPoster = '';
var cmsNoKeyword = '';

var getQueryString = function (field, url) {
        var href = url ? url : window.location.href;
        var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
        var string = reg.exec(href);
        return string ? string[1] : null;
    };


(function () {
   
    var schemeId = utils.localStorage().get('SchemeId');
    document.addEventListener("deviceready", onDeviceReady, false);
    var user = utils.localStorage().get('user');
    $(function () {
        utils.Analytics.trackPage('Scheme Details');
    });


    function SaveSchemeToBen() {
        if ($('input[name=apply-scheme]:checked').length > 0) {
            var schemeId = getQueryString("schemeId") != null ? getQueryString("schemeId") : 0;
            var BenId = $('input[name=apply-scheme]:checked').val();
            var user = utils.localStorage().get('user');
            var UserId = user.userName;
            var req = {

            }
            var ajaxObj = {
                url: utils.Urls.BeneficiaryApplied,
                type: 'POST',
                obj: {
                    'schemeId': schemeId,
                    'beneficiaryId': BenId,
                    'userId': UserId
                }

            };
            utils.ajaxCall(ajaxObj.url, ajaxObj.type, ajaxObj.obj, callBackAppliedScheme);


        }
    }

    function callBackAppliedScheme(data) {
        if (data == true) {
            $("#successShow").show();
            $("#erroShow").hide();
        }
        else {
            $("#erroShow").show();
            $("#successShow").hide();
        }

    }
    function getDateInFormat(dateVal)
    {
        if (dateVal != null) {
            var date = new Date(dateVal);
           return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear()
        }
        else {
            return "N/A";
        }
    }
    
    var db = window.openDatabase("SoochnaSevaDB_Offline", "1.0", "SoochnaSevaDB_Offline", 2000000);
    var AdditionalDetailsCnt = 0;
    db.transaction(querySchemeDetails, errorCB);
    db.transaction(querySchemeBenefits, errorCB);
    db.transaction(querySchemeQuestionAns, errorCB);
    db.transaction(querySchemeUploadDocument, errorCB);
    db.transaction(queryCMS, errorCB);
    utils.localStorage().set('AdditionalDetailsCnt', AdditionalDetailsCnt);
    if (AdditionalDetailsCnt == 0) {
        $("#btnAdditionalDetails").hide();
        $("#mainAdditionalDetails").hide();
    }


    function querySchemeDetails(tx) {
        var user = utils.localStorage().get('user');

        var schemeId = utils.localStorage().get('SchemeId');

        var queryText = "SELECT ID, UnSchemeId,SchemeName, SchemeStartDate, SchemeEndDate, LastAmendmentDate,Objective,BenefitsFrequencyID, "
        queryText += " NumberOfBenfeciaries,ApplicationFormAvailableDate,LastDateToGetApplicationForm,LastDateOfFormSubmission,BeneficiarySelectionAnnouncementDate, "
        queryText += " WhereDocumentSubmission,IsSchemeActive,OperatorRemark,ApproverRemark,AdminRemark,StateId,DistrictId,DepartmentId,DomainId,OriginatorId,MinAge, "
        queryText += " MaxAge,Sex,MaritalStatusID,IncomeId,AnnualFamilyIncome,OccupationId,CasteId,EmpStatusID,QualificationId,ReligonID,ApplicationFormUpload,LangID, "
        queryText += " CategoryID,VulnerableID,DisabilityID,DisabilityPercent,Disease,FundDisbursed,IDProofDocumentID,AddressProofDocumentID,SicknessID,PaymentModeID, "
        queryText += " PaymentLocationID,FundDisburesementTimeID,FundDisbursementFrequencyID,ContactPerson,ContactEmailId,ContactNumber,SchemeStatus,OperatorName, "
        queryText += " ApproverName,Keywords,SubmissionDate,SpecialBasicDetailsAddon,SpecialEligibilityAddon,SpecialApplicationAddon,SpecialAdditionalAddon,IsSubmitted, "
        queryText += " IsPopular, StateNames, DistrictNames, DepartmentNames, DomainNames, OriginatorNames, MaritalStatusNames, IncomeLevelNames, OccupationNames, CasteNames, "
        queryText += " EmpStatusNames, QualificationNames, ReligonNames, SpecialStatusNames, DisablityNames, IDProofDocumentsNames, AddressProofDocumentsNames, SicknessNames, "
        queryText += " PaymentModeNames, PaymentLocationNames, FundDisbursementTimeNames, BenefitFrequencyNames, SchemeURL, SchemeTypeId, SchemeTypeName,ProcessingFee, IDProofComments, AddressProofComments  FROM Scheme  WHERE ID = " + schemeId;

        // queryText += " WHERE  LangID = " + LangId;
         //console.log(queryText);
        tx.executeSql(queryText, [], querySchemeDetailSuccess, errorCB);
    }
    // Query the queryRecentSchemesSuccess callback
    function querySchemeDetailSuccess(tx, scheme) {
        var popularDiv = '';
        var len = scheme.rows.length;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                var keywords = getKeyWords(scheme.rows.item(i).Keywords);
                var schemeName = scheme.rows.item(i).SchemeName;
                var SID = scheme.rows.item(i).ID;
                if (schemeName != null && schemeName != undefined && schemeName.length > 45) {
                    schemeName = schemeName.substring(0, 45) + "...";
                }
                popularDiv += ' <div class="width60 items news-item-box" onclick=ShowScheme(' + scheme.rows.item(i).ID + ')>';
                popularDiv += '<div class="news-item1">';
                popularDiv += '<div class="news-item2">' + scheme.rows.item(i).SchemeName + '</div>';
                popularDiv += '<div class="tags news-item3"><span>';
                popularDiv += keywords + '</span></div> </div> </div>';
                
                //Analytics
                try {
                    var track = {
                        Category: 'SchemeDetails', Action: 'Scheme', Label: { 'Id': schemeId }, Value: {'SchemeName' : scheme.rows.item(i).SchemeName}
                    };
                    utils.Analytics.trackEvent(track);
                }
                catch (e) {
                    console.log(JSON.stringify(e));
                }


                //=== GET SCHEME DETAILS ====//

                //call favorite
                GetFavorite(SID, tx);
                var keywords = getKeyWords(scheme.rows.item(i).Keywords);
                $("#divObjectiveHeader").html(keywords);

                $("#divObjective").html(scheme.rows.item(i).Objective);

                if (scheme.rows.item(i).SchemeStartDate != null && scheme.rows.item(i).SchemeStartDate != '' && scheme.rows.item(i).SchemeStartDate != 'null') {
                    $("#divStartDate").html(getDateInFormat(scheme.rows.item(i).SchemeStartDate));
                }
                else {
                    $("#mainStartDate").hide();
                }

                if (scheme.rows.item(i).SchemeEndDate != null && scheme.rows.item(i).SchemeEndDate != '' && scheme.rows.item(i).SchemeEndDate != 'null') {
                    $("#divEndDate").html(getDateInFormat(scheme.rows.item(i).SchemeEndDate));
                }
                else {
                    $("#mainEndDate").hide();
                }

                if (scheme.rows.item(i).IsSchemeActive) {
                    $("#divIsActive").html("Yes");
                }
                else {
                    $("#divIsActive").html("No");
                }

                $("#divSchemeName").html(scheme.rows.item(i).SchemeName);

                if (scheme.rows.item(i).LastAmendmentDate != null && scheme.rows.item(i).LastAmendmentDate != '' && scheme.rows.item(i).LastAmendmentDate != 'null') {
                    $("#divAmendDate").html(getDateInFormat(scheme.rows.item(i).LastAmendmentDate));
                }
                else {
                    $("#mainAmendDate").hide();
                }

                if (scheme.rows.item(i).OriginatorNames != null && scheme.rows.item(i).OriginatorNames != '' && scheme.rows.item(i).OriginatorNames != 'null') {
                    $("#divOriginatedBy").html(scheme.rows.item(i).OriginatorNames);
                }
                else {
                    $("#mainOriginatedBy").hide();
                }
                if (scheme.rows.item(i).SpecialBasicDetailsAddon != null && scheme.rows.item(i).SpecialBasicDetailsAddon != '' && scheme.rows.item(i).SpecialBasicDetailsAddon != 'null') {
                    $("#DivSpecialBasicDetailsAddon").html(scheme.rows.item(i).SpecialBasicDetailsAddon);
                }
                else {
                    $("#mainSpecialBasicDetailsAddon").hide();
                }
               // 

                //===================== Eligibility Start =================//
                var EligibilityCnt = 0;

                if (scheme.rows.item(i).DistrictNames != null && scheme.rows.item(i).DistrictNames != '' && scheme.rows.item(i).DistrictNames != 'null') {
                    $("#divStates").html(scheme.rows.item(i).StateNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainStates").hide();
                }

                if (scheme.rows.item(i).DistrictNames != null && scheme.rows.item(i).DistrictNames != '' && scheme.rows.item(i).DistrictNames != 'null') {
                    $("#divDistrict").html(scheme.rows.item(i).DistrictNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainDistrict").hide();
                }

                if (scheme.rows.item(i).DepartmentNames != null && scheme.rows.item(i).DepartmentNames != '' && scheme.rows.item(i).DepartmentNames != 'null') {
                    $("#divDepartment").html(scheme.rows.item(i).DepartmentNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainDepartment").hide();
                }

                if (scheme.rows.item(i).DomainNames != null && scheme.rows.item(i).DomainNames != '' && scheme.rows.item(i).DomainNames != 'null') {
                    $("#divDomain").html(scheme.rows.item(i).DomainNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainDomain").hide();
                }
                if (scheme.rows.item(i).SchemeURL != null && scheme.rows.item(i).SchemeURL != '' && scheme.rows.item(i).SchemeURL != 'null') {
                    $('#aSchemeURL').attr('href', scheme.rows.item(i).SchemeURL);
                    $('#aSchemeURL').text(scheme.rows.item(i).SchemeURL);
                    EligibilityCnt++;
                }
                else {
                    $("#mainSchemeURL").hide();
                }
                if (scheme.rows.item(i).SchemeTypeName != null && scheme.rows.item(i).SchemeTypeName != '' && scheme.rows.item(i).SchemeTypeName != 'null') {
                    $("#DivSchemeType").html(scheme.rows.item(i).SchemeTypeName);
                    EligibilityCnt++;
                }
                else {
                    $("#mainSchemeType").hide();
                }
                if (scheme.rows.item(i).ProcessingFee != null && scheme.rows.item(i).ProcessingFee != '' && scheme.rows.item(i).ProcessingFee != 'null') {
                    $("#DivProcessingFee").html(scheme.rows.item(i).ProcessingFee);
                    EligibilityCnt++;
                }
                else {
                    $("#mainProcessingFee").hide();
                }
                if (scheme.rows.item(i).MinAge != null && scheme.rows.item(i).MinAge != '' && scheme.rows.item(i).MinAge != 'null') {
                    $("#divMinAge").html(scheme.rows.item(i).MinAge);
                    EligibilityCnt++;
                }
                else {
                    $("#mainMinAge").hide();
                }

                if (scheme.rows.item(i).MaxAge != null && scheme.rows.item(i).MaxAge != '' && scheme.rows.item(i).MaxAge != 'null') {
                    $("#divMaxAge").html(scheme.rows.item(i).MaxAge);
                    EligibilityCnt++;
                }
                else {
                    $("#mainMaxAge").hide();
                }

                if (scheme.rows.item(i).Sex != null && scheme.rows.item(i).Sex != '' && scheme.rows.item(i).Sex != 'null') {
                    $("#divSex").html(scheme.rows.item(i).Sex);
                    EligibilityCnt++;
                }
                else {
                    $("#mainSex").hide();
                }

                if (scheme.rows.item(i).QualificationNames != null && scheme.rows.item(i).QualificationNames != '' && scheme.rows.item(i).QualificationNames != 'null') {
                    $("#divQualifaction").html(scheme.rows.item(i).QualificationNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainQualifaction").hide();
                }

                if (scheme.rows.item(i).MaritalStatusNames != null && scheme.rows.item(i).MaritalStatusNames != '' && scheme.rows.item(i).MaritalStatusNames != 'null') {
                    $("#divMaritalStatus").html(scheme.rows.item(i).MaritalStatusNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainMaritalStatus").hide();
                }

                if (scheme.rows.item(i).OccupationNames != null && scheme.rows.item(i).OccupationNames != '' && scheme.rows.item(i).OccupationNames != 'null') {
                    $("#divOccupation").html(scheme.rows.item(i).OccupationNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainOccupation").hide();
                }

                if (scheme.rows.item(i).ReligonNames != null && scheme.rows.item(i).ReligonNames != '' && scheme.rows.item(i).ReligonNames != 'null') {
                    $("#divReligion").html(scheme.rows.item(i).ReligonNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainReligion").hide();
                }

                if (scheme.rows.item(i).CasteNames != null && scheme.rows.item(i).CasteNames != '' && scheme.rows.item(i).CasteNames != 'null') {
                    $("#divCasteNames").html(scheme.rows.item(i).CasteNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainCasteNames").hide();
                }

                if (scheme.rows.item(i).EmpStatusNames != null && scheme.rows.item(i).EmpStatusNames != '' && scheme.rows.item(i).EmpStatusNames != 'null') {
                    $("#divEmploymentStatus").html(scheme.rows.item(i).EmpStatusNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainEmploymentStatus").hide();
                }

                if (scheme.rows.item(i).SpecialStatusNames != null && scheme.rows.item(i).SpecialStatusNames != '' && scheme.rows.item(i).SpecialStatusNames != 'null') {
                    $("#divSpecialStatus").html(scheme.rows.item(i).SpecialStatusNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainSpecialStatus").hide();
                }

                if (scheme.rows.item(i).IncomeLevelNames != null && scheme.rows.item(i).IncomeLevelNames != '' && scheme.rows.item(i).IncomeLevelNames != 'null') {
                    $("#divIncomeLevel").html(scheme.rows.item(i).IncomeLevelNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainIncomeLevel").hide();
                }

                if (scheme.rows.item(i).AnnualFamilyIncome != null && scheme.rows.item(i).AnnualFamilyIncome != '' && scheme.rows.item(i).AnnualFamilyIncome != 'null') {
                    $("#divAnnualFamilyIncome").html(scheme.rows.item(i).AnnualFamilyIncome);
                    EligibilityCnt++;
                }
                else {
                    $("#mainAnnualFamilyIncome").hide();
                }

                if (scheme.rows.item(i).DisablityNames != null && scheme.rows.item(i).DisablityNames != '' && scheme.rows.item(i).DisablityNames != 'null') {
                    $("#divTypeOfDisability").html(scheme.rows.item(i).DisablityNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainTypeOfDisability").hide();
                }

                if (scheme.rows.item(i).DisabilityPercent != null && scheme.rows.item(i).DisabilityPercent != '' && scheme.rows.item(i).DisabilityPercent != 'null') {
                    $("#divPercentageOfDisablity").html(scheme.rows.item(i).DisabilityPercent);
                    EligibilityCnt++;
                }
                else {
                    $("#mainPercentageOfDisablity").hide();
                }

                if (scheme.rows.item(i).SicknessNames != null && scheme.rows.item(i).SicknessNames != '' && scheme.rows.item(i).SicknessNames != 'null') {
                    $("#divSickness").html(scheme.rows.item(i).SicknessNames);
                    EligibilityCnt++;
                }
                else {
                    $("#mainSickness").hide();
                }

                if (scheme.rows.item(i).SpecialEligibilityAddon != null && scheme.rows.item(i).SpecialEligibilityAddon != '' && scheme.rows.item(i).SpecialEligibilityAddon != 'null') {
                    $("#divAddEligibilityCriteria").html(scheme.rows.item(i).SpecialEligibilityAddon);
                    EligibilityCnt++;
                }
                else {
                    $("#mainAddEligibilityCriteria").hide();
                }


                if (EligibilityCnt == 0) {
                    $("#btnEligibility").hide();
                    $("#mainEligibility").hide();
                }

                //===================== Eligibility End =================//

                //===================== Benefit Start ==================//
                //if (response.Benefits.length != undefined && response.Benefits.length > 0) {
                //    $("#divSchemeDtls").html(response.Benefits[0].Details);
                //}
                //else {
                //    $("#mainSchemeDtls").hide();
                //    $("#btnBenefits").hide();
                //}
                //===================== Benefit End =================//

                //===================== Application Details Start =================//

                var ApplicationDetailsCnt = 0;

                if ((scheme.rows.item(i).IDProofDocumentsNames != null && scheme.rows.item(i).IDProofDocumentsNames != '' && scheme.rows.item(i).IDProofDocumentsNames != 'null') || (scheme.rows.item(i).AddressProofDocumentsNames != null && scheme.rows.item(i).AddressProofDocumentsNames != '' && scheme.rows.item(i).AddressProofDocumentsNames != 'null')) {
                    $("#divDocumentSubmitted").html(scheme.rows.item(i).IDProofDocumentsNames + ',' + scheme.rows.item(i).AddressProofDocumentsNames);
                    ApplicationDetailsCnt++;
                }
                else {
                    $("#mainDocumentSubmitted").hide();
                }

                if ((scheme.rows.item(i).IDProofComments != null && scheme.rows.item(i).IDProofComments != '' && scheme.rows.item(i).IDProofComments != 'null')) {
                    $("#divIdProofComments").html(scheme.rows.item(i).IDProofComments);
                    ApplicationDetailsCnt++;
                }
                else {
                    $("#mainIdProofComments").hide();
                }

                if ((scheme.rows.item(i).AddressProofComments != null && scheme.rows.item(i).AddressProofComments != '' && scheme.rows.item(i).AddressProofComments != 'null')) {
                    $("#divAddressProofComments").html(scheme.rows.item(i).AddressProofComments);
                    ApplicationDetailsCnt++;
                }
                else {
                    $("#mainAddressProofComments").hide();
                }

                if (scheme.rows.item(i).WhereDocumentSubmission != null && scheme.rows.item(i).WhereDocumentSubmission != '' && scheme.rows.item(i).WhereDocumentSubmission != 'null') {
                    $("#divWhomWhereTSubDoc").html(scheme.rows.item(i).WhereDocumentSubmission);
                    ApplicationDetailsCnt++;
                }
                else {
                    $("#mainWhomWhereTSubDoc").hide();
                }

                if (scheme.rows.item(i).ApplicationFormAvailableDate != null && scheme.rows.item(i).ApplicationFormAvailableDate != '' && scheme.rows.item(i).ApplicationFormAvailableDate != 'null') {
                    $("#divAppAvalDate").html(getDateInFormat(scheme.rows.item(i).ApplicationFormAvailableDate));
                    ApplicationDetailsCnt++;
                }
                else {
                    $("#mainAppAvalDate").hide();
                }

                if (scheme.rows.item(i).LastDateToGetApplicationForm != null && scheme.rows.item(i).LastDateToGetApplicationForm != '' && scheme.rows.item(i).LastDateToGetApplicationForm != 'null') {
                    $("#divLastAppDate").html(getDateInFormat(scheme.rows.item(i).LastDateToGetApplicationForm));
                    ApplicationDetailsCnt++;
                }
                else {
                    $("#mainLastAppDate").hide();
                }

                if (scheme.rows.item(i).LastDateOfFormSubmission != null && scheme.rows.item(i).LastDateOfFormSubmission != '' && scheme.rows.item(i).LastDateOfFormSubmission != 'null') {
                    $("#divLastDateSubmit").html(getDateInFormat(scheme.rows.item(i).LastDateOfFormSubmission));
                    ApplicationDetailsCnt++;
                }
                else {
                    $("#mainLastDateSubmit").hide();
                }

                if (scheme.rows.item(i).BeneficiarySelectionAnnouncementDate != null && scheme.rows.item(i).BeneficiarySelectionAnnouncementDate != '' && scheme.rows.item(i).BeneficiarySelectionAnnouncementDate != 'null') {
                    $("#divBeneficiaryAnnounmentDate").html(getDateInFormat(scheme.rows.item(i).BeneficiarySelectionAnnouncementDate));
                    ApplicationDetailsCnt++;
                }
                else {
                    $("#mainBeneficiaryAnnounmentDate").hide();
                }
                if (scheme.rows.item(i).SpecialApplicationAddon != null && scheme.rows.item(i).SpecialApplicationAddon != '' && scheme.rows.item(i).SpecialApplicationAddon != 'null') {
                    $("#divSpecialApplicationAddon").html(scheme.rows.item(i).SpecialApplicationAddon);
                    ApplicationDetailsCnt++;
                }
                else {
                    $("#mainSpecialApplicationAddon").hide();
                }

                if (ApplicationDetailsCnt == 0) {
                    $("#btnApplicationDetails").hide();
                    $("#mainApplicationDetails").hide();
                }


                //===================== Application Details End =================//


                //===================== Fund reimbursement Start =================//

                var FundreimbursementCnt = 0;

                if (scheme.rows.item(i).PaymentModeNames != null && scheme.rows.item(i).PaymentModeNames != '' && scheme.rows.item(i).PaymentModeNames != 'null') {
                    $("#divModeOfPayment").html(scheme.rows.item(i).PaymentModeNames);
                    FundreimbursementCnt++;
                }
                else {
                    $("#mainModeOfPayment").hide();
                }

                if (scheme.rows.item(i).PaymentLocationNames != null && scheme.rows.item(i).PaymentLocationNames != '' && scheme.rows.item(i).PaymentLocationNames != 'null') {
                    $("#divPaymentLocation").html(scheme.rows.item(i).PaymentLocationNames);
                    FundreimbursementCnt++;
                }
                else {
                    $("#mainPaymentLocation").hide();
                }

                if (scheme.rows.item(i).FundDisbursementTimeNames != null && scheme.rows.item(i).FundDisbursementTimeNames != '' && scheme.rows.item(i).FundDisbursementTimeNames != 'null') {
                    $("#divTimeOfPayment").html(scheme.rows.item(i).FundDisbursementTimeNames);
                    FundreimbursementCnt++;
                }
                else {
                    $("#mainTimeOfPayment").hide();
                }

                if (scheme.rows.item(i).BenefitFrequencyNames != null && scheme.rows.item(i).BenefitFrequencyNames != '' && scheme.rows.item(i).BenefitFrequencyNames != 'null') {
                    $("#divFrequency").html(scheme.rows.item(i).BenefitFrequencyNames);
                    FundreimbursementCnt++;
                }
                else {
                    $("#mainFrequency").hide();
                }

                if (FundreimbursementCnt == 0) {
                    $("#btnFundreimbursement").hide();
                    $("#mainFundreimbursement").hide();
                }

                //===================== Fund reimbursement End =================//


                //===================== Contact Details Start =================//

                var ContactDetailsCnt = 0;

                if (scheme.rows.item(i).ContactPerson != null && scheme.rows.item(i).ContactPerson != '' && scheme.rows.item(i).ContactPerson != 'null') {
                    $("#divContactPerson").html(scheme.rows.item(i).ContactPerson);
                    ContactDetailsCnt++;
                }
                else {
                    $("#mainContactPerson").hide();
                }

                if (scheme.rows.item(i).ContactNumber != null && scheme.rows.item(i).ContactNumber != '' && scheme.rows.item(i).ContactNumber != 'null') {
                    $("#divContactNumber").html(scheme.rows.item(i).ContactNumber);
                    ContactDetailsCnt++;
                }
                else {
                    $("#mainContactNumber").hide();
                }

                if (scheme.rows.item(i).ContactEmailId != null && scheme.rows.item(i).ContactEmailId != '' && scheme.rows.item(i).ContactEmailId != 'null') {
                    $("#divContactEmail").html(scheme.rows.item(i).ContactEmailId);
                    ContactDetailsCnt++;
                }
                else {
                    $("#mainContactEmail").hide();
                }

                if (ContactDetailsCnt == 0) {
                    $("#btnContactDetails").hide();
                    $("#mainContactDetails").hide();
                }

                //===================== Contact Details End =================//


                //===================== Additional Details Start =================//



                //if (scheme.rows.item(i).Keywords != null && scheme.rows.item(i).Keywords != '') {
                //    $("#divKeywords").html(scheme.rows.item(i).Keywords);
                //    AdditionalDetailsCnt++;
                //}
                //else {
                $("#mainKeywords").hide();
                //}

                if (scheme.rows.item(i).OperatorRemark != null && scheme.rows.item(i).OperatorRemark != '' && scheme.rows.item(i).OperatorRemark != 'null') {
                    $("#divRemarks").html(scheme.rows.item(i).OperatorRemark);
                    AdditionalDetailsCnt++;
                }
                else {
                    $("#mainRemarks").hide();
                }

                //if (response.Details.length != undefined && response.Details.length > 0) {

                //    for (var i = 0; i < response.Details.length; i++) {
                //        if (response.Details[i].FieldValue != "" || response.Details[i].KeyField != "") {
                //            $("#divQueAns").append("<div><div class=\"floatl upper-case anchor3 width35\">" + response.Details[i].KeyField + "</div>");
                //            $("#divQueAns").append("<div class=\"floatl width63\">" + response.Details[i].FieldValue + "</div>");
                //            $("#divQueAns").append("<div class=\"clearboth\"></div></div>");
                //            AdditionalDetailsCnt++;
                //        }
                //    }

                //}
                //else {
                //    $("#divQueAns").hide();
                //}



                //===================== Additional Details End =================//


                //var schemeId = utils.localStorage().get('SchemeId');
                //if (response.UploadDocuments != null && response.UploadDocuments.length > 0) {
                //    var docCnt = 0;
                //    var mediaCnt = 0;
                //    for (var i = 0; i < response.UploadDocuments.length; i++) {

                //        var desc = response.UploadDocuments[i].Description.replace(' ', '');
                //        desc = desc.toLowerCase();

                //        if (desc != "poster" && desc != "audio" && desc != "video") {
                //            docCnt++;
                //            $("#schemeDocDownloadFiles").append("<div>");
                //            $("#schemeDocDownloadFiles").append("<div class=\"clearboth\"></div>");
                //            $("#schemeDocDownloadFiles").append("<div class=\"width100 floatl\">");
                //            $("#schemeDocDownloadFiles").append("<div class=\"width20 floatl\"><a target=\"_blank\" href=\"" + response.UploadDocuments[i].UploadPath + "\"><img class=\"max-width50\" src=\"images/download-btn.png\" /></a></div>");
                //            $("#schemeDocDownloadFiles").append("<div class=\"text-align-l width80 floatl\">" + response.UploadDocuments[i].Description + "</div>");
                //            $("#schemeDocDownloadFiles").append("</div>");
                //            $("#schemeDocDownloadFiles").append("</div>");
                //        }
                //        else {
                //            if (desc == "poster") {
                //                mediaCnt++;
                //                $("#divSchemeMedia").append("<div>");
                //                $("#divSchemeMedia").append("<img class=\"max-width90\" src=\"" + response.UploadDocuments[i].UploadPath + "\" alt=\"" + response.UploadDocuments[i].Description + "\" style=\"\" />");
                //                $("#divSchemeMedia").append("</div>");
                //            }

                //        }

                //    }
                //}
                //else {
                //    $("#schemeDocDownloadFiles").html("<div><div class=\"clearboth\"></div><div class=\"upper-case\">No Document Available</div></div>");
                //}

                //if (docCnt == 0) {
                //    $("#schemeDocDownloadFiles").html("<div><div class=\"clearboth\"></div><div class=\"upper-case\">No Document Available</div></div>");
                //}
                //if ((mediaCnt == 0) && schemeId != null && schemeId != 184 && schemeId != 196) {
                //    $("#divSchemeMedia").html("<div><div class=\"clearboth\"></div><div class=\"upper-case\">No posters/videos Available</div></div>");
                //}


                //=== END GET SCHEME DETAILS ====//




            }
            $("#divRecent").append(popularDiv);
            // $('#myModal').modal('hide');

        }

    }

    function querySchemeBenefits(tx) {
        var user = utils.localStorage().get('user');

        var schemeId = utils.localStorage().get('SchemeId');

        var queryText = "SELECT ID, Sex, MaritalStatus, BenefitTypeID, Details, LangID, SchemeID, MaxAge, MinAge FROM SchemeBenefits  WHERE SchemeID = " + schemeId;

        tx.executeSql(queryText, [], querySchemeBenefitsSuccess, errorCB);
    }

    function querySchemeBenefitsSuccess(tx, data) {
        var len = data.rows.length;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                $("#divSchemeDtls").html(data.rows.item(i).Details);
            }
        }
        else {
            $("#mainSchemeDtls").hide();
            $("#btnBenefits").hide();
        }
    }
    
    function onDeviceReady() {
        var schemeId = utils.localStorage().get('SchemeId');
        var user = utils.localStorage().get('user');
        window.analytics.startTrackerWithId('G-LLFW6FG6QY', 7200);
        try {
            window.analytics.trackView('Scheme Details - SchemeId = ' + schemeId + ' User ' + user.userName);
        } catch (e) {
            console.log(JSON.stringify(e));
        }

    }
    function querySchemeQuestionAns(tx) {
        var user = utils.localStorage().get('user');

        var schemeId = utils.localStorage().get('SchemeId');

        var queryText = "SELECT ID, SchemeID, KeyField, FieldValue, LangID  FROM SchemeDetails  WHERE SchemeID = " + schemeId;

        tx.executeSql(queryText, [], querySchemeQuestionAnsSuccess, errorCB);
    }

    function querySchemeQuestionAnsSuccess(tx, data) {
        var len = data.rows.length;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                if (data.rows.item(i).FieldValue != "" || data.rows.item(i).KeyField != "") {
                    $("#divQueAns").append("<div><div class=\"floatl upper-case anchor3 width35\">" + data.rows.item(i).KeyField + "</div>");
                    $("#divQueAns").append("<div class=\"floatl width63\">" + data.rows.item(i).FieldValue + "</div>");
                    $("#divQueAns").append("<div class=\"clearboth\"></div></div>");
                    AdditionalDetailsCnt++;
                }
            }
        }
        else {
            $("#divQueAns").hide();
        }
    }

    function querySchemeUploadDocument(tx) {
        var user = utils.localStorage().get('user');

        var schemeId = utils.localStorage().get('SchemeId');

        var queryText = "SELECT ID, SchemeID, Description, UploadPath  FROM SchemeDocuments  WHERE SchemeID = " + schemeId;

        tx.executeSql(queryText, [], querySchemeUploadDocumentSuccess, errorCB);
    }

    function querySchemeUploadDocumentSuccess(tx, data) {
        var len = data.rows.length;
        var schemeId = utils.localStorage().get('SchemeId');
        var LangId = 1;
        LangId = utils.localStorage().get('LangID');
        var docCnt = 0;
        var mediaCnt = 0;
        if (len > 0) {
            for (var i = 0; i < len; i++) {

                var desc = data.rows.item(i).Description.replace(' ', '');
                desc = desc.toLowerCase();

                if (desc != "poster" && desc != "audio" && desc != "video") {
                    docCnt++;
                    $("#schemeDocDownloadFiles").append("<div>");
                    $("#schemeDocDownloadFiles").append("<div class=\"clearboth\"></div>");
                    $("#schemeDocDownloadFiles").append("<div class=\"width100 floatl\">");
                    $("#schemeDocDownloadFiles").append("<div class=\"width20 floatl\"><a target=\"_blank\" href=\"" + data.rows.item(i).UploadPath + "\"><img class=\"max-width50\" src=\"images/download-btn.png\" /></a></div>");
                    $("#schemeDocDownloadFiles").append("<div class=\"text-align-l width80 floatl\">" + data.rows.item(i).Description + "</div>");
                    $("#schemeDocDownloadFiles").append("</div>");
                    $("#schemeDocDownloadFiles").append("</div>");
                }
                else {
                    if (desc == "poster") {
                        mediaCnt++;
                        $("#divSchemeMedia").append("<div>");
                        $("#divSchemeMedia").append("<img class=\"max-width90\" src=\"" + data.rows.item(i).UploadPath + "\" alt=\"" + data.rows.item(i).Description + "\" style=\"\" />");
                        $("#divSchemeMedia").append("</div>");
                    }

                }

            }
        }
        else {
            $("#schemeDocDownloadFiles").html("<div><div class=\"clearboth\"></div><div class=\"upper-case\">" + cmsNoDocument + "</div></div>");
        }

        if (docCnt == 0) {
            $("#schemeDocDownloadFiles").html("<div><div class=\"clearboth\"></div><div class=\"upper-case\">"+ cmsNoDocument +" </div></div>");
        }
        if (mediaCnt == 0) {
            $("#divSchemeMedia").html("<div><div class=\"clearboth\"></div><div class=\"upper-case\">" + cmsNoPoster + "</div></div>");
        }
    }


})();

function queryCMS(tx) {
    
    var user = utils.localStorage().get('user');
    var LangId = 1;
    LangId = utils.localStorage().get('LangID');
    var queryText = "SELECT ApplicationId, CMSKeyId, CMSKeyValueId, KeyName, KeyValue, LanguageId FROM CMS  WHERE LanguageId =" + LangId;
    tx.executeSql(queryText, [], queryCMSSuccess, errorCB);
}

// Query the success callback
function queryCMSSuccess(tx, data) {
    var len = data.rows.length;
    if (len > 0) {
        for (var i = 0; i < len; i++) {
            switch (data.rows.item(i).KeyName) {
                case 'CmsSchemeDetails':
                    $('#DivSchemeDetails').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsShare':
                    $('#DivShare').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsMakeFavorite':
                    $('#DivFavourite').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsApply':
                    $('#DivApply').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsObjective':
                    $('#DivObjectiveText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsEligibility':
                    $('#btnEligibility').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsApplicationDetails':
                    $('#btnApplicationDetails').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsContactDetails':
                    $('#btnContactDetails').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsIsActive':
                    $('#DivIsActiveText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsOginiatedBy':
                    $('#DivOriginatedByText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsState':
                    $('#DivStateText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsSchemeURLText':
                    $('#DivSchemeURLText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsSchemeTypeText':
                    $('#DivSchemeTypeText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsProcessingFeeText':
                    $('#DivProcessingFeeText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsDistrict':
                    $('#DivDistrictText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsBenefits':
                    $('#btnBenefits').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsFrequency':
                    $('#divFrequencyText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsFundReimbursement':
                    $('#btnFundreimbursement').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsDocSubmitted':
                    $('#DivDocToSubmitText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsIdProofComments':
                    $('#DivIdProofCommentsText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsAddressProofComments':
                    $('#DivAddressProofCommentsText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsPaymentMode':
                    $('#divPaymentModeText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsPaymentLocation':
                    $('#divPaymentLocationText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsPaymentLocationCriteria':
                    $('#PaymentLocationTextCriteria').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsPaymentTime':
                    $('#divPaymentTimeText').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsSchemeBenefits':
                    $('#DivSchemeBenefitsText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsWhereSubmitDoc':
                    $('#DivWhereToSubmitText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsContactPerson':
                    $('#DivContactPersonText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsContactEmail':
                    $('#DivContactEmailText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsSex':
                case 'CmsGender':
                    $('#DivSexText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsMarital':
                    $('#DivMaritalText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsCategory':
                    $('#DivDomainText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsDepartment':
                    $('#DivDepartmentText').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsCaste':
                  //  $('#divCasteNames').html(data.rows.item(i).KeyValue);
                    $('#DivCasteText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsReligion':
                    $('#DivReligionText').html(data.rows.item(i).KeyValue);
                    break;
               
                case 'CmsIncomeLevel':
                    $('#DivIncomeLevelText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsFamilyIncome':
                    $('#DivFamilyIncomeText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsDisability':
                    $('#DivDisabilityText').html(data.rows.item(i).KeyValue);
                    break;
                    
                case 'CmsContactNumber':
                    $('#DivContactNumberText').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsOccupation':
                    $('#DivOccupationText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsQualification':
                    $('#DivQualificationText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsEmpStatus':
                    $('#DivSplStatusText').html(data.rows.item(i).KeyValue);
                    break;
                    
                case 'CmsSplStatus':
                    $('#DivEmpStatusText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsUserSearchText':
                    $('#DivUserFindText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsBasicDetail':
                    $('#btnBasicDetails').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsAddlElg':
                    $('#DivAddElgText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsSchemeEndDate':
                    $('#DivEndDateText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsSchemeStartDate':
                    $('#DivStartDateText').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsSchemeAmendDate':
                    $('#DivAmendDateText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsMinAge':
                    $('#DivMinAgeText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsMaxAge':
                    $('#DivMaxAgeText').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsIdDetails':
                    $('#benIDDtls').attr("placeholder", data.rows.item(i).KeyValue);
                    break;
                case 'CmsFirstName':
                    $('#benFirstName').attr("placeholder", data.rows.item(i).KeyValue);
                    break;
                case 'CmsSearch':
                    $('#add-scheme-bene').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsName':
                    utils.localStorage().set('CmsName', data.rows.item(i).KeyValue);
                    $('#DivNameResult').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsFatherOrHusbandName':
                    utils.localStorage().set('CmsFatherOrHusbandName', data.rows.item(i).KeyValue);
                    $('#DivFatherNameResult').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsIdNumber':
                    utils.localStorage().set('CmsIdNumber', data.rows.item(i).KeyValue);
                    $('#DivIdNumberResult').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsAddToBenProfile':
                    $('#DivAddToBenProfile').html(data.rows.item(i).KeyValue);
                    break;
                 
                case 'CmsAlreadyAdded':
                    $('#Div1').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsAddedSuccessfully':
                    $('#msg').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsGoToBenProfile':
                    $('#benProfile').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsAddToAnother':
                    $('#add-scheme-another-bene').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsSchemeDocuments':
                    $('#DivSchemeDocuments').html(data.rows.item(i).KeyValue);
                    break;
                    
                case 'CmsAddAppDetails':
                    $('#DivSpecialApplicationAddonText').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsAddBasicDetails':
                    $('#DivSpecialBasicDetailsAddonText').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsSchemeProcessingFees':
                    $('#SchemeAmountAdded').html(data.rows.item(i).KeyValue);
                    break;
                case 'CmsClose':
                    $('#BtnClose').html(data.rows.item(i).KeyValue);
                    break;

                case 'CmsDocNotAvailable':
                    cmsNoDocument= data.rows.item(i).KeyValue;
                    break;
                case 'CmsPosterNotAvailable':
                    cmsNoPoster= data.rows.item(i).KeyValue;
                    break;
                case 'CmsNoKeyword':
                    cmsNoKeyword = data.rows.item(i).KeyValue;
                    break;
            }

        }
    }
}


function GetTab(tabId) {
    if (tabId == 1) {
        $("#divSchemeData").show();
        $("#divSchemeDoc").hide();
        $("#divSchemeMedia").hide();
    }
    else if (tabId == 2) {
        $("#divSchemeMedia").show();
        ShowVideo();
        $("#divSchemeData").hide();
        $("#divSchemeDoc").hide();

    } else if (tabId == 3) {
        $("#divSchemeData").hide();
        $("#divSchemeDoc").show();
        $("#divSchemeMedia").hide();

    }
}
function ShowVideo() {
    var schemeId = utils.localStorage().get('SchemeId');
   // var videoFile = '';
    
    if (schemeId != null)
        {
        if (schemeId == 184) {
            ////videoFile = 'media/PM.mp4';
            //sources[0].src = 'media/PM.mp4';
            $('#VideoPM').show();
            $('#VideoNWPS').hide();
        }
        else if(schemeId==196){
            // videoFile = 'media/NWPS.mp4';
            //sources[0].src = 'media/NWPS.mp4';
            $('#VideoPM').hide();
            $('#VideoNWPS').show();
        }
    }
    //$('#SchemeVideo video source').attr('src', videoFile);
    //$("#SchemeVideo video").load();// [0].load();
    //video.load();
}
function GetFavorite(schemeId, tx) {
    var queryText = "SELECT  ID, Keywords, LangId, Objective, SchemeName, UnSchemeId ";
    queryText += " FROM FavouriteSchemes ";
    queryText += " WHERE ID =" + schemeId;
    tx.executeSql(queryText, [], queryGetFavoriteSuccess, errorCB);

}

function queryGetFavoriteSuccess(tx, data) {

    var len = data.rows.length;
    if (len > 0) {
        var isFav = $("#divFav").html();
        if (isFav == '<img class="max-width30 fav-icon" src="images/fav.png">') {
            $("#divFav").html(isFav.replace('<img class="max-width30 fav-icon" src="images/fav.png">', '<img class="max-width30 fav-icon" src="images/fav-plain.png">'));
        }
        else {
            if (isFav == '<img class="max-width30 fav-icon" src="images/fav-plain.png">') {
                $("#divFav").html(isFav.replace('<img class="max-width30 fav-icon" src="images/fav-plain.png">', '<img class="max-width30 fav-icon" src="images/fav.png">'));
            }
        }
    }
}
function MakeSchemeFavourite()
{
    var schemeId = getQueryString("schemeId") != null ? getQueryString("schemeId") : 0;
    if (schemeId == 0) {
        schemeId=  utils.localStorage().get('SchemeId');
    }
    var user = utils.localStorage().get('user');
    var LangId = utils.localStorage().get('LangID');
    //var ajaxObj = {
    //    url: utils.Urls.AddFavourite,
    //    type: 'POST',
    //    obj: {
    //        "UserName": user.userName,
    //        "SchemeID": schemeId,
    //        "LangId": LangId
    //    }

    //};
    //utils.ajaxCall(ajaxObj.url, ajaxObj.type, ajaxObj.obj, callback);
    utils.localStorage().set('IsSchemeDetails', true);
    MakeFavourite(schemeId);

}

var callback = function (data) {
    if (data == true) {
        var isFav = $("#divFav").html();
        if (isFav == '<img class="max-width30 fav-icon" src="images/fav.png">')
        {
            $("#divFav").html(isFav.replace('<img class="max-width30 fav-icon" src="images/fav.png">', '<img class="max-width30 fav-icon" src="images/fav-plain.png">'));
        }
        else
        {
            if (isFav == '<img class="max-width30 fav-icon" src="images/fav-plain.png">') {
                $("#divFav").html(isFav.replace('<img class="max-width30 fav-icon" src="images/fav-plain.png">', '<img class="max-width30 fav-icon" src="images/fav.png">'));
            }
        }
        
       // alert('Saved successfully.');
    }
    //else
    //{
    //    alert('Problem making this scheme favourite. Please retry after some time.');
    //}
};

var getKeyWords = function (data) {
    var words = '';
    if (data == null || data.length <= 0) {
        words += '<div>' + cmsNoKeyword +' </div>';
    }
    else {
        var keywords = data.split(',');
        if (keywords != null && keywords.length > 0) {
            for (var j = 0; j < keywords.length; j++) {
                words += '#' + $.trim(keywords[j]) + ' ';
            }
        }

    }

    return words;
};

