import { from, fromEvent, Observable, of, Subscription } from 'rxjs';
import { catchError, debounceTime, switchMap, map } from 'rxjs/operators';

interface IQueryParameter {
    paramName: string;
    paramValue: string;
}

interface IRepository {
    name: string;
    description: string;
    language: string;
    html_url: string;
}

interface IResponseObject {
    items: IRepository[];
}

const defaultQueryParams: IQueryParameter[] = [
    { paramName: 'sort', paramValue: 'stars' },
    { paramName: 'order', paramValue: 'desc' }
];

const baseUri: string = 'https://api.github.com/search/repositories';

const inputEvent$: Observable<IRepository[]> =
    fromEvent(document.getElementById('searchInput') as HTMLInputElement, 'keyup').pipe(
        debounceTime(500),
        switchMap((event: Event): Observable<IResponseObject> => {
            const searchToken: string = (event.target as HTMLInputElement).value;
            const queryParams: string = defaultQueryParams.reduce((concat: string, current: IQueryParameter) => {
                return concat + `&${current.paramName}=${current.paramValue}`;
            }, '');

            return from(fetch(`${baseUri}?q=${searchToken}${queryParams}`)).pipe(
                switchMap((data: object) => {
                    return from((data as Response).json());
                }),
                catchError((error: TypeError) => {
                    alert(`The error has been catched: ${error}`);
                    return of(null);
                })
            );
        }),
        map((response: IResponseObject): IRepository[] => {
            return response.items;
        })
    );

const inputEventSubscriber: Subscription = inputEvent$.subscribe((repositories: IRepository[]): void => {
    showResults(repositories);
});

function showResults(repositories: IRepository[]): void {
    const searchResultsContainer: HTMLDivElement = document.getElementById('searchResultsContainer') as HTMLDivElement;

    if (!repositories || repositories.length === 0) {
        searchResultsContainer.innerHTML = 'Nothing found...';

        return;
    }

    searchResultsContainer.innerHTML = '';

    repositories.forEach((item: IRepository) => {
        const repositoryItem: HTMLDivElement = document.createElement('div');
        const repositoryName: HTMLHeadingElement = document.createElement('h3');
        const repositoryDescription: HTMLParagraphElement = document.createElement('p');
        const repositoryLanguage: HTMLSpanElement = document.createElement('span');
        const repositoryLink: HTMLAnchorElement = document.createElement('a');

        [repositoryName.innerText, repositoryDescription.innerText, repositoryLanguage.innerText]
        = [item.name, item.description, item.language];

        repositoryName.className = 'repository-name';
        repositoryDescription.className = 'repository-description';
        repositoryLanguage.className = 'repository-language';
        repositoryLink.className = 'repository-link';
        repositoryLink.setAttribute('href', item.html_url);
        repositoryLink.setAttribute('target', '_blank');

        repositoryItem.append(repositoryName, repositoryDescription, repositoryLanguage, repositoryLink);
        repositoryItem.className = 'repository-item';

        searchResultsContainer.appendChild(repositoryItem);
    });
}