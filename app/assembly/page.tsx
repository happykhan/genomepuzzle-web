'use client'
import React, { useEffect, useState } from 'react';

const AssemblyPage = () => {
    interface Sample {
        public_name: string;
        R1_URL: string;
        R2_URL: string;
    }

    const [samples, setSamples] = useState<Sample[]>([]);
    const [speciesList, setSpeciesList] = useState([]);
    const [samplesheet, setSamplesheet] = useState<{ url: string }>({ url: '' });    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/file_details.json')
            .then(response => response.json())
            .then(data => {
                console.log('File details:', data);
                setSamples(data.samples);
                setSpeciesList(data.answer_sheet.species); 
                setSamplesheet(data.sample_sheet);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching the file details:', error);
                setLoading(false);
            });
    }, []);


    return (
        <div className="flex flex-col items-center max-w-[800px] mx-auto">
            <h1><em>De novo</em> genome assembly puzzle</h1>
            {loading ? (
                <div><p>The today's genome puzzle is loading...</p></div>
            ) : (
            <div>
                <p>
                    Welcome to this genome puzzle, a challenge designed to test your bioinformatics skills, and/or benchmark the 
                    performance of your tools or pipelines for <em>de novo</em> genome assembly. This is an excellent 
                    opportunity to demonstrate your expertise in genome reconstruction, quality control, and sequence analysis.
                </p>
                <h2>Challenge Overview</h2>
                <p>
                    You are provided with {samples.length} genome samples belonging to the species <em>{speciesList.join(', ')}</em>. 
                    Your task is to:
                </p>
                <ul className="list-disc list-inside">
                    <li>Assemble the genomes using <em>de novo</em> assembly software.</li>
                    <li>Perform quality control (QC) to assess and validate the quality of your assemblies.</li>
                    <li>Judge if the genome passes or fails QC, and consider the reason why.</li>
                    <li>Report the MLST sequence type for each sample based on the assembled genomes.</li>
                </ul>

                <h2>Sample Sheet</h2>
                <p>
                    To help you organize and submit your results, a sample sheet has been provided.
                </p>
                <p>
                    Please download it using the link: <a href={samplesheet.url}>Download the sample sheet here</a>.
                    Fill out the sheet with the following information for each sample:
                </p>
                <ul className="list-disc list-inside">
                    <li>Sample ID</li>
                    <li>Decision on passing or failing quality control</li>
                    <li>MLST sequence type</li>
                    <li>Any additional notes or observations</li>
                </ul>

                <h2>Table of Samples</h2>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left px-4 py-2">Sample Name</th>
                            <th className="text-left px-4 py-2">R1 URL</th>
                            <th className="text-left px-4 py-2">R2 URL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {samples.map((sample, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="px-4 py-2">{sample.public_name}</td>
                                <td className="px-4 py-2"><a href={sample.R1_URL} target="_blank" rel="noopener noreferrer">{sample.R1_URL.split('/').pop()}</a></td>
                                <td className="px-4 py-2"><a href={sample.R2_URL} target="_blank" rel="noopener noreferrer">{sample.R2_URL.split('/').pop()}</a></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h2>Download Samples</h2>
                <p>You can download the samples in one go on the command line using something like curl or wget. Here are some example script to help:</p>
                <ul className="list-disc list-inside">
                    <li><a href='/wget-download_samples.txt'>Example script using wget</a></li>
                    <li><a href='/curl-download_samples.txt'>Example script using curl</a></li>
                </ul>

                <h2>Steps to Follow</h2>
                If you are new to the process of genome assembly for microbial genomics, here are some steps to guide you through the process:
                <h3><em>De novo</em> genome assembly</h3>
                <ul className="list-disc list-inside">
                    <li>Use the raw sequencing data provided to assemble each genome.</li>
                    <li>Employ your preferred tools or pipelines (e.g., <a href="https://github.com/ablab/spades" target="_blank" rel="noopener noreferrer">SPAdes</a>).</li>
                    <li>Do <strong>not</strong> use a reference-assisted assembly method.</li>
                    <li>Do <strong>not</strong> use a read mapping method, and call the consensus sequence.</li>
                </ul>
                <h3>Quality Control</h3>
                <p>
                    Validate your assemblies by performing thorough quality control checks.
                    Consider key statistics, including:
                </p>
                <ul className="list-disc list-inside">
                    <li>Measure assembly contiguity with N50 and N90 values.</li>
                    <li>Ensure it aligns with expected values for the species, looking at the total assembly size.</li>
                    <li>Evaluate fragmentation by looking at the number of contigs/scaffolds.</li>
                    <li>Assess genome completeness with tools like <a href="https://busco.ezlab.org/" target="_blank" rel="noopener noreferrer">BUSCO</a> or <a href="https://ecogenomics.github.io/CheckM/" target="_blank" rel="noopener noreferrer">CheckM</a>.</li>
                    <li>Assess contamination.</li>                    
                </ul>
                <h3>MLST Typing</h3>
                <ul className="list-disc list-inside">
                    <li>Determine the Multilocus Sequence Typing (MLST) sequence type for each genome.</li>
                    <li>Use appropriate tools (e.g., <a href="https://github.com/tseemann/mlst" target="_blank" rel="noopener noreferrer">MLST</a>, <a href="https://pubmlst.org/" target="_blank" rel="noopener noreferrer">pubMLST</a>) and the relevant MLST scheme for <em>{speciesList.join(', ')}</em>.</li>
                    <li>Provide the MLST sequence type. It will be a number such "ST10" or "ST100". You do not need to provide the allele profile in your answers.</li>
                </ul>
                <h3>Where to run analyses</h3>
                <p>
                    You can run your analyses on your local machine or a high-performance computing (HPC) cluster. If running on your local machine, you will likely need to be running a Unix-based operating system (e.g., Linux or macOS). 
                    You can run these tools on Windows with some difficulty using the <a href="https://learn.microsoft.com/en-us/windows/wsl/about" target="_blank" rel="noopener noreferrer">Windows Subsystem for Linux (WSL)</a>, a virtual machine, or using containers (e.g., Docker).
                    If you need a platform to run your analyses, you can use the <a href="https://usegalaxy.eu/" target="_blank" rel="noopener noreferrer">Galaxy platform</a>.
                    Galaxy is an open, web-based platform for accessible, reproducible, and transparent computational research.
                </p>
            </div>
            )}
            
        </div>
    );
};


export default AssemblyPage;