import os
import json
import boto3
from botocore.client import Config
import argparse
from dotenv import load_dotenv
import logging
import csv
import random
import string

# Set up logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

def create_download_script(file_details):
    script_content = "#!/bin/bash\n\n"
    for sample in file_details['samples']:
        script_content += f"curl -O {sample['R1_URL']}\n"
        script_content += f"curl -O {sample['R2_URL']}\n"
    script_content += f"curl -O {file_details['sample_sheet']['url']}\n"
    script_path = "public/curl-download_samples.txt"
    with open(script_path, "w", encoding="utf-8") as script_file:
        script_file.write(script_content)
    os.chmod(script_path, 0o755)
    logging.info("Download script created at %s", script_path)

    # Generate WGET script content
    wget_script_content = "#!/bin/bash\n\n"
    for sample in file_details['samples']:
        wget_script_content += f"wget {sample['R1_URL']}\n"
        wget_script_content += f"wget {sample['R2_URL']}\n"
    wget_script_content += f"wget {file_details['sample_sheet']['url']}\n"
    
    wget_script_path = "public/wget-download_samples.txt"
    # Write WGET script
    with open(wget_script_path, "w", encoding="utf-8") as wget_script_file:
        wget_script_file.write(wget_script_content)
    os.chmod(wget_script_path, 0o755)
    logging.info("WGET download script created at %s", wget_script_path)


def generate_random_string(length=8, random_seed=42):
    random.seed(random_seed)
    letters = string.ascii_lowercase + string.digits
    return "".join(random.choice(letters) for i in range(length))


def upload_files_to_r2(directory_path, dotenv, random_seed=42):
    # Load environment variables from .env file
    if not load_dotenv(dotenv):
        raise ValueError("Could not load environment variables from .env file.")

    # Read values from environment variables
    bucket_name = os.getenv("BUCKET_NAME")
    access_key_id = os.getenv("ACCESS_KEY_ID")
    secret_access_key = os.getenv("SECRET_ACCESS_KEY")
    endpoint_url = os.getenv("ENDPOINT_URL")
    public_url = os.getenv("PUBLIC_URL")

    # Check if environment variables are set
    if not all([bucket_name, access_key_id, secret_access_key, endpoint_url]):
        raise ValueError(
            "One or more environment variables are not set. Please check your .env file."
        )

    # find answer_sheet.csv
    answer_sheet = []
    answer_sheet_path = [
        os.path.join(directory_path, x)
        for x in os.listdir(directory_path)
        if x.endswith("answer_sheet.csv")
    ][0]
    sample_sheet_path = [
        os.path.join(directory_path, x)
        for x in os.listdir(directory_path)
        if x.endswith("sample_sheet.csv")
    ][0]
    with open(answer_sheet_path, mode="r", encoding="utf-8") as csv_file:
        csv_reader = csv.DictReader(csv_file)
        answer_sheet = [row for row in csv_reader]
        for x in answer_sheet:
            x["R1_URL"] = f"{public_url}/{x['r1']}"
            x["R2_URL"] = f"{public_url}/{x['r2']}"
            x["R1_PATH"] = os.path.join(directory_path, x["r1"])
            x["R2_PATH"] = os.path.join(directory_path, x["r2"])
    # Initialize S3 client for Cloudflare R2
    s3 = boto3.client(
        "s3",
        aws_access_key_id=access_key_id,
        aws_secret_access_key=secret_access_key,
        endpoint_url=endpoint_url,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )
    file_details = {'samples': []}
    # Walk through the directory and upload files
    for sample in answer_sheet:
        # Upload file to R2
        logging.info("Uploading %s to R2...", sample["public_name"])
        file_details['samples'].append({
            'public_name': sample['public_name'],
            'R1_URL': sample['R1_URL'],
            'R2_URL': sample['R2_URL']
        })
        for fastq in [sample["R1_PATH"], sample["R2_PATH"]]:
            key = os.path.basename(fastq)
            try:
                # Check if file already exists
                #s3.head_object(Bucket=bucket_name, Key=key)
                logging.info("File %s already exists in bucket, skipping...", key)
            except s3.exceptions.ClientError:
                # File doesn't exist, upload it
                #s3.upload_file(fastq, bucket_name, key)
                logging.info("Successfully uploaded %s", key)

    random_filename = (
        f"answer_sheet_{generate_random_string(random_seed=random_seed)}.csv"
    )
    # Read answer sheet and get out list of included species 
    species_list = list(set(row['SPECIES'] for row in answer_sheet))    
    # Upload answer_sheet.csv with random filename
    # s3.upload_file(answer_sheet_path, bucket_name, random_filename)
    file_details['answer_sheet'] = { 'filename': random_filename, 'url': f'{public_url}/{random_filename}', 'species': species_list }
    # upload sample_sheet.csv
    # s3.upload_file(sample_sheet_path, bucket_name, "sample_sheet.csv")
    file_details['sample_sheet'] = { 'filename': 'sample_sheet.csv', 'url': f'{public_url}/sample_sheet.csv' }
    # Write details to JSON file
    with open("public/file_details.json", "w", encoding="utf-8") as json_file:
        json.dump(file_details, json_file, indent=4)



    create_download_script(file_details)



if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload files to Cloudflare R2.")
    parser.add_argument(
        "--path",
        type=str,
        help="The directory path to upload files from.",
        default="../genomepuzzle/output_final",
    )
    parser.add_argument(
        "--dotenv", type=str, help="dotenv file", default=".r3_config.env"
    )
    parser.add_argument("--random_seed", type=int, help="random seed", default=42)
    args = parser.parse_args()

    upload_files_to_r2(args.path, args.dotenv, args.random_seed)
