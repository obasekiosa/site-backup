var sjs = SimpleJekyllSearch({
    searchInput: document.getElementById('search-input'),
    resultsContainer: document.getElementById('search-results'),
            json: '/search.json',
    searchResultTemplate: '<li><a href="{url}" title="{description}">{title}</a></li>',
    noResultsText: 'No results found..',
    limit: 10,
    fuzzy: true,
})