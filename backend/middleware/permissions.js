const roleHierarchy = {
    'admin': 3,
    'editor': 2,
    'visualizador': 1
};

function checkPermission(requiredRole) {
    return (req, res, next) => {
        const userRole = req.user.role;

        if (!userRole) {
            return res.status(403).json({ error: 'Permissão não definida' });
        }

        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        if (userLevel >= requiredLevel) {
            next();
        } else {
            res.status(403).json({
                error: 'Permissão negada',
                message: `Esta ação requer permissão de ${requiredRole} ou superior`
            });
        }
    };
}

// Atalhos para permissões comuns
const requireAdmin = checkPermission('admin');
const requireEditor = checkPermission('editor');
const requireVisualizador = checkPermission('visualizador');

module.exports = {
    checkPermission,
    requireAdmin,
    requireEditor,
    requireVisualizador
};
