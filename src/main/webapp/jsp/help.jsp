<%@page contentType="text/html" pageEncoding="UTF-8" %>
<%@taglib prefix="t" tagdir="/WEB-INF/tags" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib uri="http://jawr.net/tags" prefix="jwr" %>

<c:set var="contextPath" value="${pageContext.request.contextPath}" />
<t:generic>
    <jsp:attribute name="head">
        <jwr:script src="/js/common.min.js"/>
    </jsp:attribute>
    <jsp:attribute name="breadcrumbs">
        <ul class="breadcrumbs">
            <li><a href="${contextPath}/">BioStudies</a></li>
            <li>
                <span class="show-for-sr">Current: </span> Help
            </li>
        </ul>
    </jsp:attribute>
    <jsp:body>
        <style>
            p{
                text-align: justify;
            }
            .mono {
                font-family: Consolas, monospace, 'Courier New';
                font-size: 10pt;
                color: #58585a;
            }
            pre {
                font-family: Consolas, monospace, 'Courier New';
                font-size: 9pt;
                white-space: pre-line;
                color: #58585a;
                padding: 10pt;
                background-color: #eee;
            }
        </style>
        <h3>How to search BioStudies database</h3>

        <p>Use the Search box available in the top-right corner of every page. Enter any words that
            describe studies
            you are interested in. As you start typing, a drop-down list will appear suggesting terms that match.
            For terms that are in <a href="http://www.ebi.ac.uk/efo" target="_blank">EFO</a>
            (<a href="http://www.ebi.ac.uk/efo" target="_blank">Experimental Factor Ontology</a> - an EMBL-EBI
            resource providing systematic
            descriptions of biological samples and experimental variables), a button will be provided enabling
            expansion of more specific terms. Search terms are retained in the search box, where they can be refined
            (see the <a href="#advancedsearch">Advanced search</a> section below).</p>

        <p>The search results page is a list of matching biostudies sorted according to relevance.
            You can also change the sorting by using the <i>Sort by</i> selector. If there are many results,
            they will be split over multiple pages. Links at the top of the results allow you to change the number
            of studies displayed per page as well as the current result page. Clicking on the title of a study
            takes you to a more detailed page about that study.</p>

        <p>Within the results any matching terms are highlighted.
            <span class="highlight">Yellow</span> highlighting indicates
            exact matches, <span class="synonym">green</span> highlighting indicates synonyms,
            and <span class="efo">peach</span> highlighting indicates more specific
            matches (e.g. "carcinoma" as a more specific term for "cancer"). These more specific terms are from EFO.
        </p>

        <h3 id="advancedsearch">Advanced search</h3>

        <p>Each word in the query is treated as a separate term (unless surrounded by double
            quotes), and by default
            every result has to contain all the terms. This behaviour can be modified by using boolean operators and
            brackets; e.g., Leukemia AND ( mouse OR human ), or cancer AND NOT ( human ).</p>

        <p>Queries containing star or question mark characters are treated separately. A star
            character will match
            any combination of zero or more characters, e.g., leuk*mia will match to leukemia and leukaemia, as well
            as leukqwertymia. A question mark character will match any single characters, e.g., m?n will match both
            man and men. Queries that include wildcards are not expanded.</p>


        <h3 id="download">How to download public studies</h3>
        <p> In addition to file download from the BioStudies website, we also support FTP and Aspera based downloads. In
            both cases you will need to know the location of the files belonging to a particular study. We partition data first by
            the pipeline, such as <span class="mono">S-EPMC</span> for data imported from EuropePMC, <span class="mono">S-BSST</span> for data submitted via BioStudies
            Submission Tool, or <span class="mono">S-DIXA-</span> for data belonging to the ‘diXa’ toxicogenomics data collection. The next
            partition level is by the last 3 digits of the study accession number. E.g., all EuropePMC studies with
            accession numbers ending on <span class="mono">001</span> will be in the folder <span class="mono">S-EPMC/S-EPMCxxx001</span>. So, if the study you want to
            access is <span class="mono">S-EPMC521001</span>, the path will be <span class="mono">S-EPMC/S-EPMCxxx001/S-EPMC521001</span>. If there are less than 3 digits
            in an accession number, e.g., <span class="mono">S-BSST12</span>, the directory will be <span class="mono">S-BSST/S-BSST0-99/S-BSST12</span>.</p>

        <h4>FTP downloads</h4>
        <p>The FTP server is <span class="mono">ftp.biostudies.ebi.ac.uk</span>; anonymous downloads are enabled. You can explore access through
            FTP via your web browser, e.g., <a target="_blank" href="ftp://ftp.biostudies.ebi.ac.uk/pub/S-BSST/S-BSST0-99/S-BSST12">
                <span class="mono">ftp://ftp.biostudies.ebi.ac.uk/pub/S-BSST/S-BSST0-99/S-BSST12</span></a>. Use any FTP
            client such as FileZilla, or issue FTP commands via a command line, e.g.,
            <span class="mono">wget ftp://ftp.biostudies.ebi.ac.uk/pub/S-BSST/S-BSST0-99/S-BSST12/aeipf_denoised_reads.fna</span>
            or, for interactive access:
        <pre class="pre">
        ftp ftp.biostudies.ebi.ac.uk
        Name: anonymous
        Password: enter your e-mail address
        ftp> cd pub/S-BSST/S-BSST0-99/S-BSST12
        ftp> get aeipf_denoised_reads.fna
        </pre>
        </p>

        <h4>Aspera downloads</h4>
        <p>Aspera <span class="mono">ascp</span> command line client can be downloaded here:
            <a href="http://www.asperasoft.com/downloads/connect" target="_blank">http://www.asperasoft.com/downloads/connect</a>. Please
            select the correct operating system. The ascp command line client is distributed as part of the ‘Aspera
            connect’ high-performance transfer browser plug-in.
            Your command for download should be like this:
        <pre>ascp -P33001 -i &lt;aspera key&gt; bsaspera@fasp-beta.ebi.ac.uk:&lt;files to download&gt; &lt;download location on your machine&gt;</pre>
        where
        <ul>
            <li>P33001 and <span class="mono">bsaspera@fasp-beta.ebi.ac.uk</span> defines the server, port and user for Aspera connection</li>
            <li>Aspera key (<span class="mono">asperaweb_id_dsa.openssh</span>) is the public key for Aspera connection.
                &lt;aspera key&gt; might be:
                <ul>
                    <li>on Linux: <span class="mono">&lt;aspera connect installation directory&gt;/etc/asperaweb_id_dsa.openssh</span></li>
                    <li>on Mac OSX: <span class="mono">&lt;aspera connect installation directory&gt;/asperaweb_id_dsa.openssh</span></li>
                    <li>on Windows: <span class="mono">"%userprofile%\AppData\Local\Programs\Aspera\Aspera Connect\etc\asperaweb_id_dsa.openssh"</span> for
                        if Aspera Connect has been installed only for the current user or
                        <span class="mono">"%programfiles(x86)%\Aspera\Aspera Connect\etc\asperaweb_id_dsa.openssh"</span>
                        if Aspera Connect has been installed for all users</li>
                </ul>
            </li>
            <li><span class="mono">&lt;files to download&gt;</span> might be all files for a certain study, as explained above.
                Please note that Aspera paths do not need to have <span class="mono">pub</span> as the root folder.</li>
        </ul>

        For instance, here's the command line to download the file <span class="mono">aeipf_denoised_reads.fna</span> from submission <span class="mono">S-BSST12</span> to the directory <span class="mono">C:\Temp</span> on Windows.
        <pre class="pre">
            "%userprofile%\AppData\Local\Programs\Aspera\Aspera Connect\bin\ascp.exe" -P33001  -i "%userprofile%\AppData\Local\Programs\Aspera\Aspera Connect\etc\asperaweb_id_dsa.openssh" bsaspera@fasp-beta.ebi.ac.uk:/S-BSST/S-BSST0-99/S-BSST12/aeipf_denoised_reads.fna C:\Temp\
        </pre>
        </p>

    </jsp:body>
</t:generic>

