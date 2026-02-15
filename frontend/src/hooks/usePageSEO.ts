import { useEffect } from 'react';

export const usePageSEO = ({
    title,
    description,
    keywords = []
}: {
    title: string;
    description?: string;
    keywords?: string[];
}) => {
    useEffect(() => {
        // Update Title
        document.title = title.includes('TurfBook') ? title : `${title} | TurfBook`;

        // Update Meta Description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            if (description) {
                metaDescription.setAttribute('content', description);
            }
        } else {
            const newMeta = document.createElement('meta');
            newMeta.name = 'description';
            if (description) newMeta.content = description;
            document.head.appendChild(newMeta);
        }
    }, [title, description, keywords]);
};
