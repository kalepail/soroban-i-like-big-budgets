docker run --rm -i \
    -p "8000:8000" \
    --name stellar \
    stellar/quickstart:pr579-latest \
    --local \
    --limits unlimited \
    --enable-soroban-rpc \
    --enable-soroban-diagnostic-events