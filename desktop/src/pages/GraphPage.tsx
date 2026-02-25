/**
 * Graph Page
 * Main page for knowledge graph visualization
 */

import React from 'react';
import { GraphExplorer } from '../components/GraphExplorer';

export const GraphPage: React.FC = () => {
    return (
        <div className="h-screen w-full overflow-hidden">
            <GraphExplorer initialLimit={100} />
        </div>
    );
};

export default GraphPage;
