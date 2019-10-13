/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from "fs";
import * as entities from "entities";

import { Table, Column, Model, DataType, AfterSync } from "sequelize-typescript";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class SI_Unit extends Model<SI_Unit>
{
    @AfterSync
    static async populate()
    {
        return SI_Unit.count().then(count => {
            if (count === 0) {
                return this.bulkCreate(data);
            }
        });
    }

    @Column({ allowNull: false })
    code: string;

    @Column({ allowNull: false })
    name: string;

    @Column
    parentName: string;

    @Column
    isni: string;
}

////////////////////////////////////////////////////////////////////////////////

var convertRaw = function()
{
    const unitsRaw = JSON.parse(fs.readFileSync("/app/services/api/secrets/si-units-raw.json", "utf8"));
    const units = unitsRaw.map(unit => {
        const name = entities.decodeHTML(unit["URL.desc"]);
        const entry = isniCodes.find(preset => preset.name === name);

        return {
            isni: entry ? entry.isni : null,
            name,
            code: entities.decodeHTML(unit["UnitAbbreviation"]),
            parentName: entities.decodeHTML(unit["ParentOrgUnit"]),
        };
    });

    console.log(units);
    fs.writeFileSync("/app/services/api/secrets/si-units.json", JSON.stringify(units, null, 2));
};

var isniCodes = [
    { isni: '0000000105178260', name: 'Anacostia Community Museum' },
    { isni: '0000000106502747', name: 'Smithsonian Institution - Dept. of Botany' },
    { isni: '0000000106516057', name: 'National Museum of Natural History (U.S.) Vertebrate Zoology' },
    { isni: '0000000106710255', name: 'Smithsonian/Folkways Recordings' },
    { isni: '0000000110911367', name: 'Smithsonian Institution Archives' },
    { isni: '0000000120343957', name: 'Smithsonian Institution Libraries' },
    { isni: '0000000121693449', name: 'National Museum of the American Indian (U.S.)' },
    { isni: '0000000121822028', name: 'National Zoological Park' },
    { isni: '0000000122858065', name: 'National Air and Space Museum' },
    { isni: '0000000122926486', name: 'Smithsonian Center for Folklife and Cultural Heritage' },
    { isni: '0000000122951833', name: 'National Museum of African Art' },
    { isni: '0000000122969689', name: 'Smithsonian Tropical Research Institute' },
    { isni: '0000000123082510', name: 'Musée d\'art moderne (New York, N.Y.)' },
    { isni: '0000000123312646', name: 'National Park Service' },
    { isni: '0000000123642127', name: 'National Museum of Natural History (U.S.)' },
    { isni: '0000000404138402', name: 'Neuropsychological Associates of Southwest Missouri' },
    { isni: '0000000404394318', name: 'Freer Gallery of Art and Arthur M Sackler Gallery' },
    { isni: '0000000404805762', name: 'National Museum of American History' },
    { isni: '0000000404805826', name: 'National Postal Museum' },
    { isni: '0000000404805885', name: 'National Museum of African American History and Culture' },
    { isni: '0000000406043167', name: 'Cooper-Hewitt National Design Museum' },
    { isni: '0000000406379090', name: 'Hirshhorn Museum and Sculpture Garden' },
    { isni: '0000000417942934', name: 'Museum of Modern Art Library' },
    { isni: '0000000418054314', name: 'KJIVF Laparoscopy and Test Tube Baby Centre' },
    { isni: '000000044659326X', name: 'Smithsonian Latino Center' },
    { isni: '0000000449022403', name: 'Asian Pacific American Center' },
    { isni: '0000000449143600', name: 'Smithsonian Astrophysical Observatory' },
    { isni: '0000000458946499', name: 'Smithsonian American Art Museum' },
    { isni: '0000000458972996', name: 'Archives of American Art' },
    { isni: '0000000458977383', name: 'National Portrait Gallery' },
    { isni: '0000000459026221', name: 'Museum Conservation Institute' },
    { isni: '0000000459033229', name: 'CAST Astro Sciences' },
    { isni: '0000000459324683', name: 'Smithsonian Institution Office of the Chief Information Officer' },
    { isni: '0000000460334352', name: 'Wellcome Collection Wellcome Library' },
    { isni: '0000000460334378', name: 'Dr BR Ambedkar Pooja College of Pharmacy' },
    { isni: '0000000463534288', name: 'Ebooks Proquest Qa Sanity Test' },
    { isni: '0000000463639805', name: 'Mathematica Policy Research Inc Seattle Office' },
    { isni: '0000000464107552', name: 'Barona Indian Charter School' },
    { isni: '0000000464272347', name: 'University of Cambridge Department of Zoology Balfour and Newton Libraries' },
    { isni: '0000000464648842', name: 'National American University - Centennial Denver Metro Campus' },
    { isni: '000000086120361', name: 'Smithsonian Environmental Research Center' },
];

var data = [
    {
        "isni": null,
        "name": "Assistant Secretary for Education and Access",
        "code": "ASEA",
        "parentName": "Administration"
    },
    {
        "isni": null,
        "name": "Office of Advancement",
        "code": "OA",
        "parentName": "Administration"
    },
    {
        "isni": null,
        "name": "Office of Equal Employment and Minority Affairs",
        "code": "OEEMA",
        "parentName": "Administration"
    },
    {
        "isni": null,
        "name": "Office of General Counsel",
        "code": "OGC",
        "parentName": "Administration"
    },
    {
        "isni": null,
        "name": "Office of the Inspector General",
        "code": "OIG",
        "parentName": "Administration"
    },
    {
        "isni": null,
        "name": "Office of the Regents",
        "code": "OREG",
        "parentName": "Administration"
    },
    {
        "isni": null,
        "name": "Office of the Secretary",
        "code": "OS",
        "parentName": "Administration"
    },
    {
        "isni": null,
        "name": "Office of the Under Secretary for Finance & Administration",
        "code": "OUSFA",
        "parentName": "Administration"
    },
    {
        "isni": null,
        "name": "Office of the Provost",
        "code": "Provost",
        "parentName": "Administration"
    },
    {
        "isni": null,
        "name": "Accessibility Program",
        "code": "AP",
        "parentName": "Communications & External Affairs"
    },
    {
        "isni": null,
        "name": "Office of Fellowships & Internships - Public Site",
        "code": "OFI",
        "parentName": "Communications & External Affairs"
    },
    {
        "isni": null,
        "name": "Office of Fellowships & Internships - SI Forms & References",
        "code": "OFI",
        "parentName": "Communications & External Affairs"
    },
    {
        "isni": null,
        "name": "Office of Government Relations",
        "code": "OGR",
        "parentName": "Communications & External Affairs"
    },
    {
        "isni": null,
        "name": "Office of International Relations",
        "code": "OIR",
        "parentName": "Communications & External Affairs"
    },
    {
        "isni": null,
        "name": "Office of Public Affairs",
        "code": "OPA",
        "parentName": "Communications & External Affairs"
    },
    {
        "isni": null,
        "name": "Office of Special Events & Protocol",
        "code": "OSEP",
        "parentName": "Communications & External Affairs"
    },
    {
        "isni": null,
        "name": "Office of Visitor Services",
        "code": "OVS",
        "parentName": "Communications & External Affairs"
    },
    {
        "isni": null,
        "name": "OVS InfoWeb - for Volunteers",
        "code": "OVS",
        "parentName": "Communications & External Affairs"
    },
    {
        "isni": null,
        "name": "Smithsonian Associates",
        "code": "Associates",
        "parentName": "Education & Access"
    },
    {
        "isni": null,
        "name": "Smithsonian Affiliations",
        "code": "SA",
        "parentName": "Education & Access"
    },
    {
        "isni": null,
        "name": "Smithsonian Across America",
        "code": "SAA",
        "parentName": "Education & Access"
    },
    {
        "isni": null,
        "name": "Smithsonian Center for Learning and Digital Access",
        "code": "SCLDA",
        "parentName": "Education & Access"
    },
    {
        "isni": null,
        "name": "Smithsonian Early Enrichment Center",
        "code": "SEEC",
        "parentName": "Education & Access"
    },
    {
        "isni": null,
        "name": "SI Scholarly Press",
        "code": "SISP",
        "parentName": "Education & Access"
    },
    {
        "isni": null,
        "name": "Smithsonian Traveling Exhibitions",
        "code": "SITES",
        "parentName": "Education & Access"
    },
    {
        "isni": null,
        "name": "Smithsonian Science Education Center",
        "code": "SSEC",
        "parentName": "Education & Access"
    },
    {
        "isni": null,
        "name": "Office of the Chief Information Officer",
        "code": "OCIO",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Office of Contracting",
        "code": "OCon&PPM",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Office of Finance & Accounting",
        "code": "OFA",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Office of Facilities Management & Reliability",
        "code": "OFMR",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Office of Human Resources",
        "code": "OHR",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Office of Investments",
        "code": "OI",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Ombudsman",
        "code": "Ombuds",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Office of Planning, Management and Budget",
        "code": "OPMB",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Office of Protection Services",
        "code": "OPS",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Office of Sponsored Projects",
        "code": "OSP",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Privacy Office",
        "code": "PO",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Smithsonian Enterprises",
        "code": "SE",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Smithsonian Facilities",
        "code": "SF",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Smithsonian Exhibits",
        "code": "SIE",
        "parentName": "Finance & Administration"
    },
    {
        "isni": null,
        "name": "Smithsonian Organization and Audience Research",
        "code": "SOAR",
        "parentName": "Finance & Administration"
    },
    {
        "isni": "0000000458972996",
        "name": "Archives of American Art",
        "code": "AAA",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "AAA Intranet",
        "code": "AAA",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000105178260",
        "name": "Anacostia Community Museum",
        "code": "ACM",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000449022403",
        "name": "Asian Pacific American Center",
        "code": "APAC",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Center for Folklife and Cultural Heritage",
        "code": "CFCH",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Cooper-Hewitt, National Design Museum",
        "code": "CHNDM",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Friends of the National Zoo",
        "code": "FONZ",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Freer-Sackler Galleries of Art",
        "code": "FSG",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Hirshhorn Museum & Sculpture Garden",
        "code": "HMSG",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000459026221",
        "name": "Museum Conservation Institute",
        "code": "MCI",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000122858065",
        "name": "National Air and Space Museum",
        "code": "NASM",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "National Air and Space Museum Udvar-Hazy Center",
        "code": "NASM",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "NASM Intranet - Skynet",
        "code": "NASM",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "National Collections Program",
        "code": "NCP",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000404805885",
        "name": "National Museum of African American History and Culture",
        "code": "NMAAHC",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "NMAAHC Intranet - SANKOFA",
        "code": "NMAAHC",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "African Art Museum",
        "code": "NMAfA",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000404805762",
        "name": "National Museum of American History",
        "code": "NMAH",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "NMAH Intranet - The Attic",
        "code": "NMAH",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "National Museum of the American Indian",
        "code": "NMAI",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "NMAI Intranet - Ohana",
        "code": "NMAI",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "NMAI Heye Center (NYC)",
        "code": "NMAI",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "NMNH Intranet - Darwin",
        "code": "NMNH",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "National Musem of Natural  History",
        "code": "NMNH",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Botany Intranet",
        "code": "NMNH",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000458977383",
        "name": "National Portrait Gallery",
        "code": "NPG",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000404805826",
        "name": "National Postal Museum",
        "code": "NPM",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000121822028",
        "name": "National Zoological Park",
        "code": "NZP",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "NZP Intranet - ZooNet",
        "code": "NZP",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Office of the Provost",
        "code": "OUSMRP",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000458946499",
        "name": "Smithsonian American Art Museum",
        "code": "SAAM",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Renwick Gallery",
        "code": "SAAM",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000449143600",
        "name": "Smithsonian Astrophysical Observatory",
        "code": "SAO",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Smithsonian Conservation Biology Institute (Front Royal)",
        "code": "SCBI",
        "parentName": "Museums & Research"
    },
    {
        "isni": "000000086120361",
        "name": "Smithsonian Environmental Research Center",
        "code": "SERC",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000110911367",
        "name": "Smithsonian Institution Archives",
        "code": "SIA",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000120343957",
        "name": "Smithsonian Institution Libraries",
        "code": "SIL",
        "parentName": "Museums & Research"
    },
    {
        "isni": "000000044659326X",
        "name": "Smithsonian Latino Center",
        "code": "SLC",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "Smithsonian Marine Station at Fort Pierce",
        "code": "SMS",
        "parentName": "Museums & Research"
    },
    {
        "isni": "0000000122969689",
        "name": "Smithsonian Tropical Research Institute",
        "code": "STRI",
        "parentName": "Museums & Research"
    },
    {
        "isni": null,
        "name": "http://www.smithsonianchannel.com/",
        "code": "Channel",
        "parentName": "Smithsonian Enterprises"
    },
    {
        "isni": null,
        "name": "http://www.smithsonianmag.com/",
        "code": "Magazine",
        "parentName": "Smithsonian Enterprises"
    },
    {
        "isni": null,
        "name": "Smithsonian Networks",
        "code": "SN",
        "parentName": "Smithsonian Enterprises"
    },
    {
        "isni": null,
        "name": "Central Audio Visual Branch",
        "code": "AV/Smithsonian Facilities",
        "parentName": "Smithsonian Facilities"
    },
    {
        "isni": null,
        "name": "Office of Business Administration and Technical Services",
        "code": "OBATS",
        "parentName": "Smithsonian Facilities"
    },
    {
        "isni": null,
        "name": "Office of Emergency Management",
        "code": "OEM",
        "parentName": "Smithsonian Facilities"
    },
    {
        "isni": null,
        "name": "Office of Facilities Management and Reliability",
        "code": "OFMR",
        "parentName": "Smithsonian Facilities"
    },
    {
        "isni": null,
        "name": "Office of Planning, Design and Construction",
        "code": "OPDC",
        "parentName": "Smithsonian Facilities"
    },
    {
        "isni": null,
        "name": "Office of Safety, Health & Environmental Management",
        "code": "OSHEM",
        "parentName": "Smithsonian Facilities"
    },
    {
        "isni": null,
        "name": "Smithsonian Gardens",
        "code": "SG",
        "parentName": "Smithsonian Facilities"
    }
];
