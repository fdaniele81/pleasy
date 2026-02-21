import { useMemo } from 'react';

export function useUniqueValues(items, idField, mapper, sortFn = null, filterFn = null) {
  return useMemo(() => {
    if (!items || items.length === 0) return [];

    let filteredItems = filterFn ? items.filter(filterFn) : items;

    const mapperFn = typeof mapper === 'function'
      ? mapper
      : (item) => {
          const result = {};
          mapper.forEach(field => {
            result[field] = item[field];
          });
          return result;
        };

    const uniqueMap = new Map();
    filteredItems.forEach(item => {
      const key = item[idField];
      if (key != null && !uniqueMap.has(key)) {
        uniqueMap.set(key, mapperFn(item));
      }
    });

    let result = Array.from(uniqueMap.values());

    if (sortFn) {
      result = result.sort(sortFn);
    }

    return result;
  }, [items, idField, mapper, sortFn, filterFn]);
}

export function useUniqueClients(projects, filterFn = null) {
  return useMemo(() => {
    if (!projects || projects.length === 0) return [];

    const defaultFilter = (p) => p.client_id && p.client_name;
    const combinedFilter = filterFn
      ? (p) => defaultFilter(p) && filterFn(p)
      : defaultFilter;

    const clientsMap = new Map();

    projects
      .filter(combinedFilter)
      .forEach(p => {
        if (!clientsMap.has(p.client_id)) {
          clientsMap.set(p.client_id, {
            client_id: p.client_id,
            client_key: p.client_key,
            client_name: p.client_name,
            client_color: p.client_color,
          });
        }
      });

    return Array.from(clientsMap.values())
      .sort((a, b) => (a.client_key || '').localeCompare(b.client_key || ''));
  }, [projects, filterFn]);
}

export function useUniqueProjects(projects, filterClientIds = [], filterFn = null) {
  return useMemo(() => {
    if (!projects || projects.length === 0) return [];

    const projectsMap = new Map();

    projects
      .filter(p => {
        if (!p.project_id) return false;

        if (filterClientIds.length > 0 && !filterClientIds.includes(p.client_id)) {
          return false;
        }

        if (filterFn && !filterFn(p)) {
          return false;
        }

        return true;
      })
      .forEach(p => {
        if (!projectsMap.has(p.project_id)) {
          projectsMap.set(p.project_id, {
            project_id: p.project_id,
            project_key: p.project_key,
            project_title: p.project_title,
            client_id: p.client_id,
            client_key: p.client_key,
            client_color: p.client_color,
          });
        }
      });

    return Array.from(projectsMap.values())
      .sort((a, b) => {
        const aKey = `${a.client_key || ''}-${a.project_key || ''}`;
        const bKey = `${b.client_key || ''}-${b.project_key || ''}`;
        return aKey.localeCompare(bKey);
      });
  }, [projects, filterClientIds, filterFn]);
}

export function useUniqueUsers(projects, filterFn = null) {
  return useMemo(() => {
    if (!projects || projects.length === 0) return [];

    const usersMap = new Map();

    const filteredProjects = filterFn ? projects.filter(filterFn) : projects;

    filteredProjects.forEach(project => {
      if (project.tasks) {
        project.tasks.forEach(task => {
          if (task.owner_id && task.owner_name && !usersMap.has(task.owner_id)) {
            usersMap.set(task.owner_id, {
              id: task.owner_id,
              name: task.owner_name,
            });
          }
        });
      }
    });

    return Array.from(usersMap.values())
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [projects, filterFn]);
}
