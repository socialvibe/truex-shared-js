const GetFileExtension = (fileName) => {
    if (!fileName) {
        throw 'filename not provided';
    }

    if (typeof fileName !== 'string') {
        throw 'filename is not a string';
    }
    const split = fileName.split('.');
    return split[split.length - 1];
};

export { GetFileExtension };
