# pull image
docker pull $1 >/dev/null 2>&1
# save exit code
exit_code=$?
if [ $exit_code = 0 ]; then
    echo "Version already exists"
    exit 1
else
    echo "Version is good to go"
    exit 0
fi
