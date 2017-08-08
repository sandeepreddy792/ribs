var filesTable, selectedFilesCount=0, totalRows=0;

String.format = function() {
    var s = arguments[0];
    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }

    return s;
}

$.fn.groupBy = function(fn) {
    var arr = $(this),grouped = {};
    $.each(arr, function (i, o) {
        key = fn(o);
        if (typeof(grouped[key]) === "undefined") {
            grouped[key] = [];
        }
        grouped[key].push(o);
    });

    return grouped;
}
!function(d) {

    linkMap = {
        'pmc':'http://europepmc.org/articles/{0}',
        'pmid':'http://europepmc.org/abstract/MED/{0}',
        'doi':'https://dx.doi.org/{0}',
        'chembl':'https://www.ebi.ac.uk/chembldb/compound/inspect/{0}',
        'ega':'http://www.ebi.ac.uk/ega/studies/{0}',
        'uniprot':'http://www.uniprot.org/uniprot/{0}',
        'ena':'http://www.ebi.ac.uk/ena/data/view/{0}',
        'arrayexpress files':'http://www.ebi.ac.uk/arrayexpress/experiments/{0}/files/',
        'arrayexpress':'http://www.ebi.ac.uk/arrayexpress/experiments/{0}',
        'dbsnp':'http://www.ncbi.nlm.nih.gov/SNP/snp_ref.cgi?rs={0}',
        'pdbe':'http://www.ebi.ac.uk/pdbe-srv/view/entry/{0}/summary',
        'pfam':'http://pfam.xfam.org/family/{0}',
        'omim':'http://omim.org/entry/{0}',
        'interpro':'http://www.ebi.ac.uk/interpro/entry/{0}',
        'nucleotide':'http://www.ncbi.nlm.nih.gov/nuccore/{0}',
        'geo':'http://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc={0}',
        'intact':'http://www.ebi.ac.uk/intact/pages/details/details.xhtml?experimentAc={0}',
        'biostudies':'https://www.ebi.ac.uk/biostudies/studies/{0}',
        'biostudies search':'https://www.ebi.ac.uk/biostudies/studies/search.html?query={0}',
        'go':'http://amigo.geneontology.org/amigo/term/{0}',
        'chebi':'http://www.ebi.ac.uk/chebi/searchId.do?chebiId={0}',
        'bioproject':'https://www.ncbi.nlm.nih.gov/bioproject/{0}',
        'biosamples':'https://www.ebi.ac.uk/biosamples/samples/{0}',
        'chemagora':'http://chemagora.jrc.ec.europa.eu/chemagora/inchikey/{0}',
        'compound':'https://www.ebi.ac.uk/biostudies/studies/{0}'
    };

    reverseLinkMap = {
        '^europepmc.org/articles/(.*)':'PMC',
        '^europepmc.org/abstract/MED/(.*)':'PMID',
        '^dx.doi.org/(.*)':'DOI',
        '^www.ebi.ac.uk/chembldb/compound/inspect/(.*)':'ChEMBL',
        '^www.ebi.ac.uk/ega/studies/(.*)':'EGA',
        '^www.uniprot.org/uniprot/(.*)':'Sprot',
        '^www.ebi.ac.uk/ena/data/view/(.*)':'ENA',
        '^www.ebi.ac.uk/arrayexpress/experiments/(.*)/files/':'ArrayExpress Files',
        '^www.ebi.ac.uk/arrayexpress/experiments/(.*)':'ArrayExpress',
        '^www.ncbi.nlm.nih.gov/SNP/snp_ref.cgi?rs=(.*)':'dbSNP',
        '^www.ebi.ac.uk/pdbe-srv/view/entry/(.*)/summary':'PDBe',
        '^pfam.xfam.org/family/(.*)':'Pfam',
        '^omim.org/entry/(.*)':'OMIM',
        '^www.ebi.ac.uk/interpro/entry/(.*)':'InterPro',
        '^www.ncbi.nlm.nih.gov/nuccore/(.*)':'RefSeq',
        '^www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=(.*)':'GEO',
        '^dx.doi.org/(.*)':'DOI',
        '^www.ebi.ac.uk/intact/pages/details/details.xhtml?experimentAc=(.*)':'IntAct',
        '^www.ebi.ac.uk/biostudies/studies/(.*)':'BioStudies',
        '^www.ebi.ac.uk/biostudies/studies/search.html?query=(.*)':'BioStudies Search',
        '^amigo.geneontology.org/amigo/term/(.*)':'GO',
        '^www.ebi.ac.uk/chebi/searchId.do?chebiId=(.*)':'ChEBI',
        '^www.ncbi.nlm.nih.gov/bioproject/(.*)':'BioProject',
        '^www.ebi.ac.uk/biosamples/samples/(.*)':'BioSamples'
    };

    linkTypeMap = {
        'sprot': 'UniProt',
        'gen': 'ENA',
        'arrayexpress': 'ArrayExpress',
        'refsnp': 'dbSNP',
        'pdb': 'PDBe',
        'pfam': 'Pfam',
        'omim': 'OMIM',
        'interpro': 'InterPro',
        'refseq': 'Nucleotide',
        'ensembl': 'Ensembl',
        'doi': 'DOI',
        'intact': 'IntAct',
        'chebi': 'ChEBI',
        'ega': 'EGA',
        '': 'External',
        'bioproject': 'BioProject',
        'biosample': 'BioSamples',
        'compound':'Compound',
        'chemagora':'ChemAgora'
    };

    orgOrder= [];

    var params = document.location.search.replace(/(^\?)/,'').split("&").map(
        function(s) {
            return s = s.split("="), this[s[0]] = s[1], this
        }.bind({}))[0];
    registerHelpers();

    // Prepare template
    var templateSource = $('script#study-template').html();
    var template = Handlebars.compile(templateSource);
    var url = window.location.href;
    url = url.replace('/studies/','/api/v1/studies/').replace(project,'');
    $.getJSON(url,params, function (data) {
        // set accession
        $('#accession').text(data.accno);
        data.section.accno = data.accno;
        var rootPath = data.attributes.filter( function (v,i) { return    v.name=='RootPath';   });
        data.section.root = rootPath.length ? rootPath[0].value : '';
        var releaseDate = data.attributes.filter( function (v,i) { return    v.name=='ReleaseDate';   });
        data.section.releaseDate = releaseDate.length ? releaseDate[0].value : '';
        var html = template(data.section);
        d.getElementById('renderedContent').innerHTML = html;
        postRender();
    }).fail(function(error) {
        showError(error);
    });
}(document);

function registerHelpers() {

    Handlebars.registerHelper('find', function(key, keyval, val, obj) {
        var e = obj.filter( function(o) { return o[key]==keyval})[0];
        if (e!=undefined) return new Handlebars.SafeString(e[val]);
    });

    Handlebars.registerHelper('valueWithName', function(val, obj) {
        if (obj==null) return;
        var e = obj.filter( function(o) { return o['name']==val})[0];
        if (e==undefined) return '';
        return new Handlebars.SafeString( e.url ? '<a href="'
                                                    + e.url
                                                    + (e.url[0]!='#' ? '" target="_blank':'')
                                                    +'">'+e.value+'</a>'
                                                : e.value);
    });

    Handlebars.registerHelper('linkWithName', function(val, obj) {
        if (obj==null) return;
        var e = obj.filter( function(o) { return o['name']==val})[0];
        if (e==undefined) return '' ;
        var value = val.toLowerCase()=='type' && linkTypeMap[e.value.toLowerCase()] ? linkTypeMap[e.value.toLowerCase()] : e.value;
        return new Handlebars.SafeString( e.url ? '<a href="'+e.url+ (e.url[0]!='#' ? '" target="_blank':'')+'">'+ value+'</a>' : value);
    });

    Handlebars.registerHelper('renderFileTableRow', function(val, obj) {
        if (obj==null) return new Handlebars.SafeString('<td></td>');
        var e = obj.filter( function(o) { return o['name']==val})[0];
        if (e==undefined) {
            return new Handlebars.SafeString( val=='Section' ? '<td data-search=""></td>'  :'<td></td>') ;
        }
        return new Handlebars.SafeString('<td'
                + (e.sort ? ' data-sort="'+e.sort+'"' : '')
                + ( val=='Section' && e.search ? ' data-search="'+e.search +'" ' :'')
            +'>'
                + (e.url ?'<a onclick="closeFullScreen();" '
                    + 'href="'+e.url+ (e.url[0]!='#' ? '" target="_blank':'')
                + '">'
                        + new Handlebars.SafeString(e.value)
                    +'</a>'
                        :e.value
                 )
            +'</td>'
        );
    });

    Handlebars.registerHelper('ifHasAttribute', function(val, obj, options) {
        var ret = false;
        if (obj!=null) {
            var e = obj.filter(function (o) {return o['name'] == val})[0];
            ret = !(e == undefined);
        }
        return ret ? options.fn(this) : options.inverse(this);

    });


    Handlebars.registerHelper('section', function(o, shouldIndent) {
        var template = Handlebars.compile($('script#section-template').html());
        this.indentClass = (shouldIndent=='true') ? 'indented-section' : '';
        return template(o);
    });

    Handlebars.registerHelper('table', function(o) {
        var template = Handlebars.compile($('script#section-table').html());
        return template(o);
    });

    Handlebars.registerHelper('ifArray', function(arr,options) {
        if(Array.isArray(arr)) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper('accToLink', function(val) {
        if (!val) return '';
        return accToLink(val);
    });

    Handlebars.registerHelper('ifRenderable', function(arr,options) {
        var specialSections = ['author', 'organization', 'funding', 'publication'];

        if(arr.type &&  $.inArray(arr.type.toLowerCase(),specialSections) < 0) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    Handlebars.registerHelper('eachGroup', function(arr, options) {
        if (!arr) return;
        var mod = arr.reduce(function(r, i) {
            r[i.name] ? r[i.name].push(i) : r[i.name]=[i];
            return r;
        }, {});
        var ret ='';
        for(var k in mod) {
            ret = ret + options.fn(mod[k]);
        }
        return ret;
    });

    Handlebars.registerHelper('setHeaders', function() {
        var names = $.map(this, function (v) {
            return $.map(v.attributes, function (v) {
                return v.name
            })
        })
        this.headers = $.unique(names);
        this.type = this[0].type
    });

    Handlebars.registerHelper('setFileTableHeaders', function(o) {
        if (this && this.length) {
            var names = ['Name', 'Size'];
            var hsh = {'Name': 1, 'Size': 1};
            $.each(this, function (i, file) {
                file.attributes = file.attributes || [];
                file.attributes.push({"name": "Name", "value": file.path});
                file.attributes.push({"name": "Size", "value": getByteString(file.size), "sort":file.size});
                $.each(file.attributes, function (i, attribute) {
                    if (!(attribute.name in hsh)) {
                        names.push(attribute.name);
                        hsh[attribute.name] = 1;
                    }
                    // make file link
                    if(attribute.name=='Name') {
                        attribute.url= contextPath+'/files/'+$('#accession').text()+'/'+ file.path
                    }
                })
            });
            if (names.indexOf("Section")>=0) names.splice(2,0,names.splice(names.indexOf("Section"),1)[0]);
            this.headers = names.filter(function (name) { return name.toLowerCase()!='type' });
            this.type = this[0].type
        }
    });

    Handlebars.registerHelper('main-file-table', function() {
        var o = findall(this,'files');
        var template = Handlebars.compile($('script#main-file-table').html());
        return template(o);
    });


    Handlebars.registerHelper('main-orcid-claimer', function(o,k) {
        var template = Handlebars.compile($('script#main-orcid-claimer').html());
        return template({accession:o.data.root.accno});
    });

    Handlebars.registerHelper('valquals', function(o) {
        var template = Handlebars.compile($('script#valqual-template').html());
        return template(o);
    });


    Handlebars.registerHelper('renderOntologySubAttribute', function(arr) {
        if (!arr) return;
        arr = arr.filter( function (o) {
            return $.inArray(o.name.toLowerCase(), ['ontology', 'termname', 'termid'])>=0
        })
        var ret = '';
        $.each(arr, function (i,o) {
            if (o.name.toLowerCase()=='ontology') {
                var termname = $.grep(arr, function (o,j) { return j>i && o.name.toLowerCase()=='termname' })[0];
                var termid = $.grep(arr, function (o,j) { return j>i && o.name.toLowerCase()=='termid' })[0];
                ret += '<span data-ontology="'+ o.value+'" ' +
                    (termid ? 'data-term-id="'+ termid.value+'" ' : '') +
                    (termname ? 'data-term-name="'+ termname.value : '') +
                    '"></span>';
            }
        });
        return ret;
    });

    Handlebars.registerHelper('eachSubAttribute', function(arr, options) {
        if (!arr) return;
        return arr.filter( function (o) {
            return $.inArray(o.name.toLowerCase(), ['ontology', 'termname', 'termid'])<0
        }).map( function(o, i, filtered) {
            return options.fn(o, {data: {first:i==0, last: i==(filtered.length-1), index : i}})
        }).join('')
    });

    Handlebars.registerHelper('section-link-tables', function(o) {
        var template = Handlebars.compile($('script#section-link-tables').html());
        return template(o.data.root);
    });

    Handlebars.registerHelper('link-table', function(o) {
        var names = ['Name'];
        var hsh = {'Name':1};
        $.each(o.links, function (i, v) {
            v.attributes = v.attributes || [];
            v.attributes.push({"name": "Name", "value": v.url});
            $.each(v.attributes, function (i, v) {
                if (!(v.name in hsh)) {
                    names.push(v.name);
                    hsh[v.name] = 1;
                }
            })
        });
        o.linkHeaders = names;
        var template = Handlebars.compile($('script#link-table').html());
        return template(o);
    });

    Handlebars.registerHelper('eachLinkTable', function(options) {
        var ret = '';
        var links = findall(this,'links');
        var groupsByColumns = $(links).groupBy(function (obj) {
            var att_fp = $.unique($.map(obj.attributes, function (attr) { return attr.name}).sort()).join('|')
            return att_fp
        });
        var keys = Object.keys(groupsByColumns), data = Handlebars.createFrame(options.data);
        $.each(keys, function(i,key) {
            data.first = i==0, data.last = i==(keys.length-1), data.index = i, data.indexPlusOne = i+1;
            ret = ret + options.fn({links: groupsByColumns[key]},{data:data});
        });
        return ret;
    });

    Handlebars.registerHelper('main-link-table', function(o) {
        var template = Handlebars.compile($('script#main-link-table').html());
        return template(o.data.root);
    });

    Handlebars.registerHelper('asString', function() {
        console.log(this)
        return this.name
    });

    Handlebars.registerHelper('eachAuthor', function(obj, options) {
        var ret = '';
        var orgs = {}

        // make an org map
        if (!obj.subsections) return '';

        $.each(obj.subsections.filter( function(o) { return o.type && o.type.toLowerCase()=='organization';}), function (i,o) {
            var orgName = o.attributes ? o.attributes.filter(function (p) { return p.name.toLowerCase()=='name'}) : [{"value":""}];
            orgs[o.accno] = orgName[0].value ;
        });


        var orgNumber = 1;
        var orgToNumberMap = {}
        var authors = obj.subsections.filter( function(o) { return o.type && o.type.toLowerCase()=='author';});
         $.each(authors, function (i,o) {
             var author = {}
             $.each(o.attributes, function (i, v) {
                 author[v.name] = v.value;
             });
             if (author.affiliation) {
                 if (!orgToNumberMap[author.affiliation]) {
                     orgToNumberMap[author.affiliation] = orgNumber++;
                     orgOrder.push(author.affiliation);
                 }
                 author.affiliationNumber = orgToNumberMap[author.affiliation]
             }
            var data = Handlebars.createFrame(options.data);
            data.first = i==0, data.last = i==(authors.length-1), data.index = i, data.left = authors.length-10;
            ret += options.fn(author, {data: data});
        });
        return ret;
    });
    Handlebars.registerHelper('eachOrganization', function(obj, options) {
        var ret = '';
        var orgs = {};

        if (!obj.subsections) return '';

        // make an org map
        $.each(obj.subsections.filter( function(o) { return o.type && o.type.toLowerCase()=='organization';}), function (i,o) {
            var orgName = o.attributes ? o.attributes.filter(function (p) { return p.name.toLowerCase()=='name'}) : [{"value":""}];
            orgs[o.accno] = orgName[0].value ;
        });

        $.each(orgOrder, function(i,v) {
            var data = Handlebars.createFrame(options.data);
            data.first = i==0, data.last = i==(orgOrder.length-1), data.index = i, data.left = orgOrder.length-10;
            ret += options.fn({name:orgs[v],affiliationNumber:i+1, affiliation:v}, {data:data});
        });
        return ret;
    });

    Handlebars.registerHelper('eachFunder', function(obj, options) {
        var ret = '';
        var orgs = {};
        if (!obj.subsections) return '';
        // make an org map
        $.each(obj.subsections.filter( function(subsection) { return subsection.type && subsection.type.toLowerCase()=='funding';}), function (i,o) {
            var org = null, grant = '';
            $(o.attributes).each(function () {
                if (this.name.toLowerCase()=='agency') org = this.value;
                if (this.name.toLowerCase()=='grant_id') grant = this.value;
            });
            if (org) {
                orgs[org] = (orgs[org]) ? orgs[org] + (", "+grant) : orgs[org] = grant;
            }
        });
        var keys = Object.keys(orgs), data = Handlebars.createFrame(options.data);
        $.each(keys, function (i,v) {
            data.first = i==0, data.last = i==(keys.length-1), data.index = i;
            ret += options.fn({name:v,grants:orgs[v]},{data:data});
        });
        return ret;
    });

    Handlebars.registerHelper('publication', function(obj, options) {
        var publication = {}
        if (!obj.subsections) return '';
        var pubs = obj.subsections.filter(function (o) {
            return o.type && o.type.toLowerCase() == 'publication';
        });
        if (!pubs || pubs.length < 1) return null;
        publication.URLs = [];
        $.each(pubs[0].attributes, function (i, v) {
            var name = v.name.toLowerCase().replace(' ', '_');
            var url = getURL(v.value);
            if (url) {
                publication.URLs.push(url);
            } else {
                publication[name] = v.value
            }
        });
        publication.accno = pubs[0].accno;
        if (publication.accno) {
            var url = getURL(publication.accno);
            if (!url && (/^\d+$/).test(publication.accno)) {
                publication.URLs.push(getURL('PMID'+publication.accno));
            } else {
                publication.URLs.push(url);
            }
        }

        if (!publication.URLs.length) delete publication.URLs

        var template = Handlebars.compile($('script#publication-template').html());
        return new Handlebars.SafeString(template(publication));
    });


    Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });

}

function findall(obj,k,unroll){ // works only for files and links
    if (unroll==undefined) unroll =true
    var ret = [];
    for(var key in obj)
    {
        if (key===k) {
            if (!obj.root) {
                var accno = obj.accno, type = obj['type'];

                $.each(obj[k], function () {
                    $.each($.isArray(this) ? this : [this], function () {
                        if (accno) {
                            this.attributes = this.attributes || [];
                            this.attributes.splice(0, 0, {
                                'name': 'Section',
                                'search': accToLink(accno),
                                'value': type,
                                'url': '#' + accToLink(accno)
                            });
                        }
                    });
                });
            }
            $.merge(ret,obj[k]);
        } else if(typeof(obj[key]) == "object"){
            $.merge(ret,findall(obj[key],k,unroll));
        }
    }
    //unroll file tables
    if (unroll) {
        return $.map( ret, function(n){
            return n;
        });
    }
    return  ret;
}

function postRender() {
    $('body').append('<div id="blocker"/><div id="tooltip"/>');
    drawSubsections();
    createDataTables();
    createMainFileTable();
    createLinkTables();
    showRightColumn();
    handleSectionArtifacts();
    handleTableExpansion();
    handleOrganisations();
    handleFileDownloadSelection();
    formatPageHtml();
    handleAnchors();
    handleSubattributes();
    handleOntologyLinks();
    handleORCIDIntegration();
    handleImageURLs();
    handleThumbnails(); //keep this as the last call
}

function  showRightColumn() {
    if ($('#right-column').text().trim().length>0) {
        $('#right-column').show();
    }
}

function createDataTables() {
    $(".section-table").each(function () {
        $(this).DataTable({
            "dom": "t",
            paging: false
        });
    });
}

function createMainFileTable() {
    totalRows = $("#file-list tbody tr").length;

    filesTable = $("#file-list").DataTable({
        "lengthMenu": [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]],
        "columnDefs": [ {"targets": [0], "searchable": false, "orderable": false, "visible": true},
         //   {"targets": [2], "searchable": true, "orderable": false, "visible": false}
            ],
        "order": [[1, "asc"]],
        "dom": "rlftpi",
        "infoCallback": function( settings, start, end, max, total, out ) {
            return (total== max) ? out : out +' <a class="section-button" id="clear-filter" onclick="clearFilter();return false;">' +
                '<span class="fa-stack bs-icon-fa-stack">' +
                '<i class="fa fa-filter fa-stack-1x"></i>' +
                '<i class="fa-stack-1x filter-cross">×</i>' +
                '</span> show all files</a>';
        }
    });
}

function getURL(accession, type) {
    if (!type) {
        type = /^[a-zA-z]+/.exec(accession);
        if (type && type.length) {
            type = type[0];
        } else {
            return null;
        }
    }
    var url =  linkMap[type.toLowerCase()] ? String.format(linkMap[type.toLowerCase()], encodeURIComponent(accession)) : null;
    if (type.toLowerCase()=='ega' && accession.toUpperCase().indexOf('EGAD')==0) {
        url = url.replace('/studies/','/datasets/');
    }
    if (accession.indexOf('http:')==0 || accession.indexOf('https:')==0  || accession.indexOf('ftp:')==0 ) {
        var value = accession.replace("http://",'').replace("https://",'').replace("ftp://",'')
        for(var r in reverseLinkMap) {
           var acc = new RegExp(r).exec(value);
           if (acc && acc.length>0) {
               return {url:accession, type: reverseLinkMap[r], text:acc[1] }
           }
        }
        url = accession;
    }
    return url ?  {url:url, type:type, text:accession} : null;
}

function createLinkTables() {

    //handle links
    $(".link-list").each(function () {
        //create external links for known link types
        var typeIndex = $('thead tr th',$(this)).map(function(i,v) {if ( $(v).text().toLowerCase()=='type') return i;}).filter(isFinite)[0];
        $("tr",this).each( function (i,row) {
            if (i==0) return;
            var type =  $($('td',row)[typeIndex]).text().toLowerCase();
            var url = getURL($($('td',row)[0]).text(), type);
            if (url) {
                $($('td',row)[0]).wrapInner('<a href="'+ url.url +'" target="_blank">');
            }
            $($('td',row)[0]).addClass("overflow-name-column");
        });

    });

    //format the right column tables
    $("#right-column .link-list").DataTable({
        "lengthMenu": [[5, 10, 25, 50, 100], [5, 10, 25, 50, 100]],
        "dom": "rlftpi"
    });

    //format section tables
    $("#bs-content .link-list").DataTable({
        "dom": "t",
        paging: false
    });
}


function drawSubsections() {
    // draw subsection and hide them
    $(".indented-section").prepend('<span class="toggle-section fa-fw fa fa-caret-right fa-icon" title="Click to expand"/>')
    $(".indented-section").next().hide();

    $('.toggle-section').parent().css('cursor', 'pointer');
    $('.toggle-section').parent().on('click', function () {
        var indented_section = $(this).parent().children().first().next();
        if (indented_section.css('display') == 'none') {
            $(this).children().first().toggleClass('fa-caret-down').toggleClass('fa-caret-right').attr('title', 'Click to collapse');
            indented_section.show();
            //redrawTables(true);
        } else {
            $(this).children().first().toggleClass('fa-caret-down').toggleClass('fa-caret-right').attr('title', 'Click to expand');
            indented_section.hide();
            //redrawTables(true);
        }
    })
    // limit section title clicks
    $(".section-title-bar").click(function(e) {
        e.stopPropagation();
    })
}

function handleSectionArtifacts() {
    $(".toggle-files, .toggle-links, .toggle-tables").on('click', function () {
        var type = $(this).hasClass("toggle-files") ? "file" : $(this).hasClass("toggle-links") ? "link" : "table";
        var section = $(this).siblings('.bs-section-' + type + 's');
        if (section.css('display') == 'none') {
            section.show();
            //redrawTables(true);
            $(this).html('<i class="fa fa-caret-down"></i> hide ' + type + ($(this).data('total') == '1' ? '' : 's'))
        } else {
            section.hide();
            $(this).html('<i class="fa fa-caret-right"></i> show ' + type + ($(this).data('total') == '1' ? '' : 's'))
        }
    });
    $(".toggle-files, .toggle-links, .toggle-tables").each(function () {
        var type = $(this).hasClass("toggle-files") ? "file(s)" : $(this).hasClass("toggle-links") ? "link(s)" : "table";
        $(this).html('<i class="fa fa-caret-right"></i> show ' + type + ($(this).data('total') == '1' ? '' : 's'));
    });

    //handle file attribute table icons
    $(".attributes-icon").on ('click', function () {
        closeFullScreen();
        var section = '#'+$(this).data('section-id');
        openHREF(section);
        var toggleLink = $(section).next().find('.toggle-tables').first();
        if (toggleLink.first().text().indexOf('show')>=0) toggleLink.click();

    });

    // add link type filters
    $(".link-filter").on('change', function() {
        var filters = $(".link-filter:checked").map(function() { return '^'+this.id+'$'}).get();
        if (filters.length==0) {
            filters = ['^$']
        }
        linksTable[$(this).data('position')-1].column(1).search(filters.join('|'),true, false).draw()
    });

}

function handleTableExpansion() {
    //table expansion
    $('.table-expander').click(function () {
        $('.fullscreen .table-wrapper').css('max-height','');
        $(this).toggleClass('fa-close').toggleClass('fa-expand');
        $(this).attr('title', $(this).hasClass('fa-expand') ? 'Click to expand' : 'Click to close');
        $('html').toggleClass('stop-scrolling');
        $('#blocker').toggleClass('blocker');
        $(this).parent().parent().toggleClass('fullscreen');
        $("table.dataTable tbody td a").css("max-width", $(this).hasClass('fa-expand') ? '200px' : '500px');
        $('.table-wrapper').css('height', 'auto');
        $('.table-wrapper').css('height', 'auto');
        $('.fullscreen .table-wrapper').css('max-height', (parseInt($(window).height()) * 0.80) + 'px').css('top', '45%');
    });
}

function handleOrganisations() {
    $('.org-link').each( function () {
        $(this).attr('href','#'+$(this).data('affiliation'));
    });
    $('.org-link').click(function () {
        var href = $(this).attr('href');
        if ($(href).hasClass('hidden')) $('#expand-orgs').click();
        $('html, body').animate({
            scrollTop: $(href).offset().top
        }, 200, function () {
            $(href).addClass('highlight-author');
            $(href).animate({opacity: 1}, 3000, function () {
                $(href).removeClass('highlight-author');
            });
        });
    });


    $('#bs-authors li .author').hover(
        function () {
            $(this).addClass('highlight-author')
            $('#'+$('.org-link',this).data('affiliation')).addClass('highlight-author')
        }, function () {
            $(this).removeClass('highlight-author')
            $('#'+$('.org-link',this).data('affiliation')).removeClass('highlight-author')
        }
    )


    $('#bs-orgs li').hover(
        function () {
            if ($('span.more',$(this)).length) return;
            $(this).addClass('highlight-author')
            $('.org-link[data-affiliation="'+this.id+'"]').parent().parent().addClass('highlight-author')
        }, function () {
            $(this).removeClass('highlight-author')
            $('.org-link[data-affiliation="'+this.id+'"]').parent().parent().removeClass('highlight-author')
        }
    )
}

function formatPageHtml() {

    updateTitleFromBreadCrumbs();

    //replace all newlines with html tags
    $('#ae-detail > .value').each(function () {
        var html = $(this).html();
        if (html.indexOf('<') < 0) { // replace only if no tags are inside
            $(this).html($(this).html().replace(/\n/g, '<br/>'))
        }
    });


    //handle escape key on fullscreen
    $(document).on('keydown',function ( e ) {
        if ( e.keyCode === 27 ) {
            $('.table-expander','.fullscreen').click();
            $('#right-column-expander','.fullscreen').click();
        }
    });

    // add highlights
    // $("#renderedContent").highlight(['mice','crkl']);
    // $("#renderedContent").highlight(['ductal','CrkII '],{className:'synonym'});
    // $("#renderedContent").highlight(['mouse','gland '],{className:'efo'});
    //
    //
    // $("#renderedContent .highlight").attr('title','This is exact string matched for input query terms');
    // $("#renderedContent .efo").attr('title','This is matched child term from Experimental Factor Ontology e.g. brain and subparts of brain');
    // $("#renderedContent .synonym").attr('title','This is synonym matched from Experimental Factor Ontology e.g. neoplasia for cancer');



}


function openHREF(href) {
    var section = $(href);
    var o = section;
    /*while (o.prop("tagName")!=='BODY') {
        var p =  o.parent().parent();
        if(o.parent().css('display')!='block') {
            p.prev().click();
        }
        o = p;
    }
    if(section.next().children().first().css('display')=='none') {
        section.click();
    }*/

    $('html, body').animate({
        scrollTop: $(section).offset().top -10
    }, 200);
}


function handleAnchors() {
    // scroll to main anchor
    if (location.hash) {
        $('#left-column').show();
        openHREF(location.hash);
    } else {
        $('#left-column').slideDown();
    }

    // handle clicks on file filters in section
    $(filesTable.column(':contains(Section)').nodes()).each( function(){
        var divId = $(this).data('search');
        if (divId !='' ) {
            var bar = $('#' + divId + '> .bs-name > .section-title-bar');
            if (!$('a[data-files-id="' + divId + '"]', bar).length) {
                bar.append('<a class="section-button" data-files-id="'
                    + divId + '"><i class="fa fa-filter"></i> show files in this section</a>'
                );
            }
        }
    });
    $("a[data-files-id]").click( function() {
        $('#all-files-expander').click();
        filesTable.column(3).search('^'+$(this).data('files-id')+'$',true,false).draw();
    });

    //handle author list expansion
    $('#bs-authors li span.more').click(function () {
        $('#bs-authors li').removeClass('hidden');
        $(this).hide();
    });

    //handle org list expansion
    $('#bs-orgs li span.more').click(function () {
        $('#bs-orgs li').removeClass('hidden');
        $(this).hide();
    });

    // handle clicks on section links in main file table
   /* $("a[href^='#']", "#file-list" ).filter(function(){ return $(this).attr('href').length>1 }).click( function(){
        var subsec = $(this).attr('href');
        closeFullScreen();
        openHREF(subsec);
    });




    // add file search filter
    if (params['fs']) {
        $('#right-column-expander').click();
        filesTable.search(params['fs']).draw();
    }
*/

}

function handleFileDownloadSelection() {
    $("#file-list tbody").on('click', 'input[type="checkbox"]', function () {
        $(this).toggleClass('selected');
        updateSelectedFiles($(this).hasClass('selected') ? 1 : -1);
    });

    $("#file-list tbody tr td a").on('click', function () {
        event.stopPropagation();
    });

    $("#download-selected-files").on('click', function () {
        // select all checked input boxes and get the href in the links contained in their siblings
        var files = $.map($('input.selected', filesTable.column(0).nodes()), function (v) {
            return $(v).data('name');
        });
        downloadFiles(files);
    });

    $("#select-all-files").on('click', function () {
        var isChecked = $(this).is(':checked');
        if (!isChecked) {
            $('input[type="checkbox"]', filesTable.column(0).nodes()).prop('checked', false);
            $('input[type="checkbox"]', filesTable.column(0).nodes()).removeAttr('checked');
            $('input[type="checkbox"]', filesTable.column(0).nodes()).removeProp('checked');
            $('input[type="checkbox"]', filesTable.column(0).nodes()).removeClass('selected');
            selectedFilesCount = 0;
        } else {
            $('input[type="checkbox"]', filesTable.column(0).nodes()).prop('checked', true);
            $('input[type="checkbox"]', filesTable.column(0).nodes()).addClass('selected');
            selectedFilesCount = totalRows;
        }
        updateSelectedFiles(0);
    });

    updateSelectedFiles(0);
}

function updateSelectedFiles(inc)
{

    if (!filesTable || !filesTable.rows() || !filesTable.rows().eq(0) ) return;
    selectedFilesCount += inc;
    $("#selected-file-text").text( (selectedFilesCount == 0
            ? 'No ' : selectedFilesCount)
        +' file'+(selectedFilesCount>1 ? 's':'')+' selected');
    if (selectedFilesCount==0) {
        $('#download-selected-files').hide();
    } else {
        $('#download-selected-files').show();
        $('#download-selected-files').text('Download' + (selectedFilesCount==2
                ? ' both'
                : selectedFilesCount>1 ? ' all '+selectedFilesCount : ''));
    }

    if (selectedFilesCount==totalRows)
        $("#select-all-files").prop('checked', true);
    else
        $("#select-all-files").removeProp('checked');

}


function downloadFiles(files) {
    var html = '';
    if (files.length==1) {
        html += '<form method="GET" target="_blank" action="'
            + contextPath + "/files/"
            + $('#accession').text() + '/' + files[0]+'" />';
    } else {
        html += '<form method="POST" target="_blank" action="'
            + contextPath + "/files/"
            + $('#accession').text() + '/zip'+location.search+'">';
        $(files).each( function(i,v) {
            html += '<input type="hidden" name="files" value="'+v+'"/>'
        });
        html += '</form>';
    }
    var submissionForm = $(html);
    $('body').append(submissionForm);
    $(submissionForm).submit();
}

function clearFilter() {
    filesTable.search('').columns().search('').draw();
}

function handleThumbnails() {
    $(filesTable.column(1).nodes()).each(function () {
        var path = $(this).text();
        $('a',this).addClass('overflow-name-column');
        $('a',this).attr('title',path);
        if ( $.inArray(path.toLowerCase().substring(path.lastIndexOf('.')+1),
                ['bmp','jpg','wbmp','jpeg','png','gif','tif','tiff','pdf','docx','txt','csv','html','htm']) >=0 ) {
            $(this).append('<a href="'+$(this).find('a').attr('href')+'" class="thumbnail-icon" data-thumbnail="'
                +contextPath+'/thumbnail/'+ $('#accession').text()+'/'+path+'"><i class="fa fa-file-image-o"></i></a>')
        }
    })

    $(filesTable.column(1).nodes()).hover( function() {
        var $tn = $(this).find('.thumbnail-icon');
        if (!$tn.length) return;
        $('#thumbnail').html('<i class="fa fa-spinner fa-pulse fa-fw"></i><span class="sr-only">Loading...</span>')
        $('#thumbnail').css('top',$tn.offset().top - 10);
        $('#thumbnail').css('left',$('#file-list-container').offset().left - $('#thumbnail').width() - 10);
        $('#thumbnail').show();
        var img = $("<img />").attr('src', $tn.data('thumbnail'))
            .on('load', function() {
                if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {
                    $('#thumbnail').hide();
                } else {
                    $('#thumbnail').html('').append(img)
                    $('#thumbnail').css('top',$tn.offset().top - 10);
                    $('#thumbnail').css('left',$('#file-list-container').offset().left - $('#thumbnail').width() - 10);
                    $('#thumbnail').show();
                }
            });
    }, function () {
        $('#thumbnail').hide();
    });

}

function getByteString(b) {
    if (b==undefined) return '';
    if (b==0) return '0 bytes';
    if (b==1) return '1 byte';
    prec = {'bytes':0, 'KB':0, 'MB':1, 'GB':2, 'TB':2, 'PB':2, 'EB':2, 'ZB':2, 'YB':2};
    keys = $.map(prec, function(v,i){return i});
    var i = Math.floor(Math.log(b) / Math.log(1000))
    return parseFloat(b / Math.pow(1000, i)).toFixed(prec[keys[i]]) + ' ' + keys[i];
}

function handleSubattributes() {
// handle sub-attributes (shown with an (i) sign)
    $('.sub-attribute-info').hover(
        function () {
            $(this).next().css('display', 'inline-block');
            $(this).toggleClass('sub-attribute-text');
        }, function () {
            $(this).next().css('display', 'none');
            $(this).toggleClass('sub-attribute-text');
        }
    );
}

function handleOntologyLinks() {
// handle ontology links
    $("span[data-term-id][data-ontology]").each(function () {
        var ont = $(this).data('ontology').toLowerCase();
        var termId = $(this).data('term-id');
        var name = $(this).data('term-name');
        $.ajax({
            async: true,
            context: this,
            url: "//www.ebi.ac.uk/ols/api/ontologies/" + ont + "/terms",
            data: {short_form: termId, size: 1},
            success: function (data) {
                if (data && data._embedded && data._embedded.terms && data._embedded.terms.length > 0) {
                    var n = name ? name : data._embedded.terms[0].description ? data._embedded.terms[0].description : null;
                    $(this).append('<a title="' + data._embedded.terms[0].obo_id +
                        ( n ? ' - ' + n : '') + '" ' +
                        'class="ontology-icon"  target="_blank" href="' + data._embedded.terms[0].iri
                        + '"><span class="icon icon-conceptual" data-icon="o"></span></a>');
                }
            }
        });

    });
}


function closeFullScreen() {
    $('.table-expander','.fullscreen').click();
    $('#right-column-expander','.fullscreen').click();
}

function handleORCIDIntegration() {
    if (typeof thorApplicationNamespace === "undefined") {
        $('#orc-id-claimer-section').hide();
        return;
    };
    var accession = $('#orcid-accession').text();
    thorApplicationNamespace.createWorkOrcId(
        $('#orcid-title').text(),
        'other', // work type from https://github.com/ORCID/ORCID-Source/blob/master/orcid-model/src/main/resources/record_2.0/work-2.0.xsd
        new Date( Date.parse($('#orcid-publication-year').text())).getFullYear(),
        document.location.origin + contextPath+"/studies/"+accession,
        null, // description
        null // db name
    );
    thorApplicationNamespace.addWorkIdentifier('other-id', accession);
    thorApplicationNamespace.loadClaimingInfo();
}

function handleImageURLs() {
// handle image URLs
    $(".sub-attribute:contains('Image URL')").each(function () {
        var url = $(this).parent().clone().children().remove().end().text();
        $(this).parent().html('<img class="url-image" src="' + url + '"/>');
    });
}

function accToLink(acc) {
    return acc.replace('/','').replace(' ','');
}