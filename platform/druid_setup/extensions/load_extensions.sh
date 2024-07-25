#!/bin/bash

destination="/druid/extensions"
version=${ZEN_DRUID_VERSION}
extensions=(
    "druid-aggregatable-first-last"
    "druid-arbitrary-granularity"
    "druid-nested-json-parser"
    "druid-tuple-sketch-expansion"
)

if [ -z "$version" ]
then
    echo "ZEN_DRUID_VERSION environment variable cannot be empty!"
    exit 1
fi

rm -r $destination/*
mkdir -p $destination
cd $destination

for extension in "${extensions[@]}"
do
    extension_name="$extension-$version.jar"
    echo "************************** Downloading extension: $extension_name **************************"
    url="https://github.com/Zenysis/$extension/raw/master/dist/$extension_name"
    mkdir -p $extension
    wget -P $extension -O "$extension/$extension_name" $url
done

# Also need to collect the datasketches jar since it is a
# requirement of `druid-tuple-sketch-expansion`.
extension_name="druid-datasketches-$version.jar"
url="https://repository.apache.org/content/groups/public/org/apache/druid/extensions/druid-datasketches/$version/$extension_name"
wget -P druid-tuple-sketch-expansion -O "druid-tuple-sketch-expansion/$extension_name" $url
